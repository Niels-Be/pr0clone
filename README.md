Pr0Clone
========

Since pr0gramm.com is lagging lately you can use this project to setup your own pr0gramm.com mirror.
The updater will frequently download new images from pr0gramm.com. You can then start the webserver and view pr0gramm.com content from your own server.

IMPORTANT: Only images are stored localy. Comments and Tags are always loaded direcly from pr0gramm.com (for now).

Demo: [pr0gramm.tost-soft.de](http://pr0gramm.tost-soft.de)

##Running
- Install [Docker](https://www.docker.com/)
- run `./run_updater` to start the updater
- run `./run_web your-domain.com 80` to start the webserver

By default the updater will fetch only images on *top* from the categories *sfw* and *nsfw*.
You can change this by editing the configs in `updater/main.js`


##Contribute

Feel free to open issues or pull requests.

### TODOs
- more error handling
- create own API to be completely independent of pr0gramm.com (exept login)
- automatically delete old images
