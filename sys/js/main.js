$ = require('./sys/js/jquery.min.js')
h337 = require('heatmap.js')

const SerialPort = require('serialport')

angular.module('bed-measurement-tool', [])

/*The master controller*/
.controller('master', function master($scope, $sce) {
	m = $scope

	m.ports = []

	m.speeds = [
		115200,
		250000
	]

	m.mode = 'normal'
	
	m.currentProbePoint = false

	m.probePoints = []

	m.speed = localStorage.getItem('baud') != 'undefined' ? parseInt(localStorage.getItem('baud')) : 250000

	m.bed = localStorage.getItem('bed') != 'undefined' ? JSON.parse(localStorage.getItem('bed')) : {}

	m.list = () => {
		SerialPort.list().then((a) => {
			m.ports = a
			
			m.port = localStorage.getItem('port')
			if (!!m.port && m.port != 'undefined') m.port = JSON.parse(m.port)

			var keep = false
			for (var i in m.ports) {
				if (m.ports[i].comName == m.port.comName) {
					keep = true
				}
			}

			if (!keep) m.port = null


			m.$applyAsync()
		})
	}

	m.connect = (port, speed, closeOnly) => {
		if (m.conn) {
			m.conn.close(() => {
				if (!closeOnly) m.connect(port, speed)
				else m.conn = null

				m.$applyAsync()
			})
			return
		}
		else {
			m.conn = new SerialPort(port.comName, {
				baudRate: speed,
				parity: 'none',
				dataBits: 8,
				stopBits: 2,
				lock: true,
				xon: false,
				xoff: false,
				xany: false

			})
			m.receiveData()

		}

	}

	m.loadBedMap = () => {
		m.bedMap = JSON.parse(localStorage.getItem('bedMap'))
		m.makeHeatmap(m.bedMap)
	}

	m.saveBedMap = () => {
		if (m.bedMap) localStorage.setItem('bedMap', JSON.stringify(m.bedMap))
	}


	m.receiveData = () => {
		const Readline = require('@serialport/parser-readline')
		const parser = new Readline()
		m.conn.pipe(parser)

		parser.on('data', (line) => {
			if (m.currentProbePoint && m.bedMap && m.currentProbePoint.mappingDetails) m.bedMap[-9999] = m.currentProbePoint.mappingDetails
			if (m.currentProbePoint && m.currentProbePoint.mapping && line.indexOf('Bed X: ') > -1) {
				m.bedMap[m.currentProbePoint.y + m.currentProbePoint.mappingDetails.padding][m.currentProbePoint.x + m.currentProbePoint.mappingDetails.padding] = parseFloat(String(line.split('Z:')[1]).trim())
				m.currentProbePoint = false
				m.processBedMeasurementCommands()
			}

			console.log('> ', line)

			if (m.currentProbePoint && !m.currentProbePoint.mapping && line == 'ok') {
				m.processBedMeasurementCommands()	
			}
		})
	}

	m.sendCommand = (data) => {
		//m.conn.write(`${data} ; \r\n`, function(err) {
		m.conn.write(`${data} ; \n`, function(err) {
			if (err) {
				return console.log('Error on write: ', err.message)
			}
		})
		m.conn.drain(() => {
			//console.log('message written')
		})		
	}

	//http://marlinfw.org/docs/gcode/G030.html
	m.makeBedCheckGCODE = (bed, passes) => {
		let points = [
				{command: 'M82'},
				{command: 'G28'},
			],
			padding = bed.padding,
			width = (bed.width - (padding*2)),
			height = (bed.height - (padding*2)),
			xChunk = width / (bed.points-1),
			yChunk = height / (bed.points -1)
			m.bedMap = {},
			count = 1

		for (var y = 0; y <= height; y = y + yChunk) {
			for (var x = 0; x <= width; x = x + xChunk) {
				m.bedMap[y + padding] = {}
				points.push({
					command: `G30 X${x + padding} Y${y + padding}`,
					mappingDetails: {
						width: width,
						height: height,
						xChunk: xChunk,
						yChunk: yChunk,
						padding: padding,
						index: count,
						total: bed.points*bed.points
					},
					x: x,
					y: y,
					mapping: true,
					passes: passes || 1
				})
				count++
			}
		}

		return points
	}

	m.runBedMeasurement = (bed) => {
		m.probePoints = m.makeBedCheckGCODE(bed)
		m.processBedMeasurementCommands ()
	}

	m.processBedMeasurementCommands = () => {
		m.mode = 'mapping'
		m.currentProbePoint = m.probePoints.shift()
		m.$applyAsync()
		if (m.currentProbePoint) {
			if (m.currentProbePoint.command == 'M82') console.log('Switching to absolute positioning')
			if (m.currentProbePoint.command == 'G28') console.log('Homing')
			if (m.currentProbePoint.mapping) console.log('Probe',m.currentProbePoint.mappingDetails.index + '/' + m.currentProbePoint.mappingDetails.total , 'point: X', m.currentProbePoint.x + m.currentProbePoint.mappingDetails.padding, 'Y', m.currentProbePoint.y + m.currentProbePoint.mappingDetails.padding)
			m.sendCommand(m.currentProbePoint.command)
		}
		else {
			m.makeHeatmap(m.bedMap)
			console.log('Total time probing:', )
			m.mode = 'normal'
		}
	}







	m.makeHeatmap = (bedMap) => {
		let details = bedMap[-9999]
		delete bedMap[-9999]

		let zValues = [],
			xValues = [],
			yValues = [],
			X = {},
			Y = {},
			data = [{
				x: [],
				y: [],
				z: [],
				type: 'heatmap',
				showscale: false
			}],
			layout = {
				//title: 'Annotated Heatmap',
				annotations: [],
				xaxis: {
					ticks: '',
					side: 'top'
				},
				yaxis: {
					ticks: '',
					ticksuffix: ' ',
					width: 700,
					height: 700,
					autosize: false
				}
			}			

		for(var y in bedMap) {
			if (data[0].y.indexOf(y) == -1) {
				data[0].y.push(y)
				data[0].z[data[0].z.length] = []
			}

			for(var x in bedMap[y]) {
				if (data[0].x.indexOf(x) == -1) data[0].x.push(x)
				data[0].z[data[0].z.length -1].push(bedMap[y][x])
				let result = {
					xref: 'x1',
					yref: 'y1',
					x: x,
					y: y,
					z: bedMap[y][x],
					text: bedMap[y][x],
					font: {
						family: 'Arial',
						size: 12,
						color: 'rgb(50, 171, 96)'
					},
					showarrow: false,
					font: {
						color: bedMap[y][x] != 0.0 ? 'white' : 'black'
					}
				}

				layout.annotations.push(result)
				console.log(data)
			}
		}


		

		/*
			for ( var i = 0; i < yValues.length; i++ ) {
			  for ( var j = 0; j < xValues.length; j++ ) {
			    var currentValue = zValues[i][j];
			    if (currentValue != 0.0) {
			      var textColor = 'black';
			    }else{
			      var textColor = 'black';
			    }
			    var result = {
			      xref: 'x1',
			      yref: 'y1',
			      x: xValues[j],
			      y: yValues[i],
			      text: zValues[i][j],
			      font: {
			        family: 'Arial',
			        size: 12,
			        color: 'rgb(50, 171, 96)'
			      },
			      showarrow: false,
			      font: {
			        color: textColor
			      }
			    };
			    layout.annotations.push(result);
			  }
			}
		*/
		Plotly.newPlot('heatmap', data, layout, {showSendToCloud: false})
	}







	m.$watch('port', function (a) {
		if (a) localStorage.setItem('port', JSON.stringify(a))
	}, true)

	m.$watch('speed', function (a) {
		if (a) localStorage.setItem('baud', a)
	}, true)

	m.$watch('bed', function (a) {
		if (a) localStorage.setItem('bed', JSON.stringify(a))
	}, true)


	m.list()
})

/*Turns off the ng-scope, et al. debug classes*/
.config(['$compileProvider', function ($compileProvider) {
	$compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|http|mailto|itpc):/);
	$compileProvider.debugInfoEnabled(false);
}])
