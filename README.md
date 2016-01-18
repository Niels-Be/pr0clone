Pr0Clone
========

Since pr0gramm.com is lagging lately you can use this project to setup your own pr0gramm.com mirror.
The updater will frequently download new images from pr0gramm.com. You can then start the webserver and view pr0gramm.com content from your own server.

IMPORTANT: Only images are stored localy. Comments and Tags are always loaded direcly from pr0gramm.com (for now).

##Running
- Install [Docker](https://www.docker.com/)
- run `./run_updater` to start the updater
- run `./run_web your-domain.com 80` to start the webserver

By default the updater will fetch only images on *top* from all categories (*sfw*,*nsfw* and *nsfl*).
You can change this by either using command line options or create `updater/config.json` from the template `updater/config.json.template`

For available options checkout `./run_updater --help`

### Advanced setup
You can also use this project without using Docker.
Go into `updater` directory and run `npm install`. Then use `node main.js` to start the updater.

For the webserver you can use either the `apache.conf` as a vhost for your already running Apache 2.4 server
Inside `apache.conf` you should replace `your-domain.com` with your domain and adapt `DocumentRoot` to the public folder of this project.

Same goes for nginx. Copy the vhost section into your own nginx vhost config file and adapt paths and domain to your needs.

##Contribute

Feel free to open issues or pull requests.

### TODOs
- more error handling
- create own API to be completely independent of pr0gramm.com (exept login)
- automatically delete old images
- Add caching parameters to webserver configs
