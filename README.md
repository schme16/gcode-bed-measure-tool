# G-code Bed Measurement Tool
This tool was written in response to the [amazing tool]([https://github.com/npiegdon/bed-inspector](https://github.com/npiegdon/bed-inspector)) written by @[npiegdon](https://github.com/npiegdon), so honestly credit goes to him.


### Results from a 5x5 (25 total) probing:
![Results from a 5x5 (25 total) probing](https://i.imgur.com/5xIw75R.png)


### Results from a 21x21 (441 total) probing:
![Results from a 21x21 (441 total) probing](https://i.imgur.com/6g4ByQ2.png)



# Installation
## Precompiled (recommended)
Check out the [Releases](https://github.com/schme16/gcode-bed-measure-tool/releases) page for the precompiled binaries.

## From Source (here be dragons!)
Requires 
 - python 2.7+
 - NodeJS 8+
 - Admin privileges (to install the build tools, not needed if you've already got the needed build tools)

Grab the source from github [schme16/gcode-bed-measure-tool](https://github.com/schme16/gcode-bed-measure-tool), 
`git clone https://github.com/schme16/gcode-bed-measure-tool.git`

Install [node-gyp]([https://www.npmjs.com/package/node-gyp](https://www.npmjs.com/package/node-gyp)), and [electron-rebuild]([https://www.npmjs.com/package/electron-rebuild](https://www.npmjs.com/package/electron-rebuild))
`npm i -g node-gyp electron-rebuild`

Note: you may need to install: [windows build-tools]([https://www.npmjs.com/package/windows-build-tools](https://www.npmjs.com/package/windows-build-tools))
`npm i --g windows-build-tools`


Enter the directory and run `npm i` to install all the prerequisites
*Note: you may need to run this as sudo/admin, depending on your setup.
You may also need to run `npm i` then `sudo npm run electron-rebuild` to finalize the install.

Once installed, you can run it by running `npm start` in the git repo folder.
<!--stackedit_data:
eyJoaXN0b3J5IjpbLTIzODg1NzgwNCwtNzkzNzI1MDc3XX0=
-->