

const SerialPort = require('serialport')

angular.module('bed-measurement-tool', [])

/*The master controller*/
.controller('master', function master($scope, $sce) {
	m = $scope
	m.ports = []
	m.speeds = [
		115200,
		256000
	]
	
	m.speed = 256000

	m.list = () => {
		SerialPort.list().then((a) => {
			m.ports = a
			m.$applyAsync()
		})
	}

	m.connect = (port, speed) => {
		if (m.conn) {
			m.conn.close(m.conn)
			return
		}
		else {
			m.conn = new SerialPort(port.comName, {
				baudRate: speed
			})
			m.receiveData()

		}

	}

	m.receiveData = () => {
		m.conn.on('data', function (data) {
			console.log('Data:', data)
		})
	}

	m.sendCommand = (data) => {
		m.conn.write(data.toUpperCase() + '\n\r', function(err) {
			if (err) {
				return console.log('Error on write: ', err.message)
			}
			console.log('message written')
		})
	}
	//http://marlinfw.org/docs/gcode/G030.html
	//
	
	m.makeBedCheckGCODE = (bed) => {
		let points = [
				{command: 'M82'},
				{command: 'G28'},
			],
			padding = 5,
			xChunk = (bed.width - (padding*2))/bed.pointsX,
			yChunk = (bed.height - (padding*2))/bed.pointsY
			
		console.log(xChunk, yChunk)

		for (var x = padding; x <= (bed.width - padding); x = x + xChunk) {
			for (var y = padding; y <= (bed.height - padding); y = y + yChunk) {
				points.push({
					command: `G30 X${x} Y${y}`,
					x: x,
					y: y,
					mapping: true
				})
			}
		}

		return points
	}


	m.runBedMeasurement = (bed) => {
		let code = m.makeBedCheckGCODE(bed)
		console.log(code)
	}

	m.list()
})

/*Turns off the ng-scope, et al. debug classes*/
.config(['$compileProvider', function ($compileProvider) {
	$compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|http|mailto|itpc):/);
	$compileProvider.debugInfoEnabled(false);
}])
