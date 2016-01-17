Pr0Clone
========

Since Pr0gramm is lagging latly you can use this project to setup your own pr0gramm.com mirror.
The updater will frequently download new images from pr0gramm. You can then start the webserver and view pr0gramm content from your own server.

IMPORTANT: Only images are stored localy. Comments and Tags are always loaded direcly from pr0gramm.com (for now)

##Running
Install [Docker](https://www.docker.com/)

run `./run_updater` to start the updater

run `./run_web your-domain.com 80` to start the webserver

By default the updater will fetch only images on *top* from the categories *sfw* and *nsfw*.
You can change this by editing the configs in `updater/main.js`


##Contribute

Feel free to open issues or pull requests
