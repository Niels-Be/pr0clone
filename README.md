Pr0clone
========

Since pr0gramm.com is lagging lately you can use this project to setup your own pr0gramm.com mirror.
The updater will frequently download new images from pr0gramm.com. You can then start the webserver and view pr0gramm.com content from your own server.

Images that are not pressent on your local server will be loaded directly from pr0gramm.com.

IMPORTANT: This will not download any images posted befor the updater was started.

## Features
- Regularly fetch images from pr0gramm.com
- Configuration options for what and how often to fetch
- Local API cache, if pr0gramm.com API is unreachable
- Images that are not present local get redirected to pr0gramm.com

## Running
- Install [Docker](https://www.docker.com/)
- run `./runDocker 8080` to start the updater and a web server on port 8080.

Now you should be able to view your pr0clone on http://your-domain.com:8080/

By default the updater will fetch only images on *top* from all categories (*sfw*,*nsfw* and *nsfl*).
You can change this by creating a config file in `updater/config.json` from the template `updater/config.json.template` and ajust the settings.

#### Advanced setup
You can also use this project without Docker.
Go into `updater` directory and run `npm install`. Then use `node main.js` to start the updater.

For available command line options checkout `node main.js --help`

For the webserver you can use either `apache.conf` or `nginx.conf` as a vhost for your already running web server.
Inside these config files you should replace `your-domain.com` with your domain and adapt `DocumentRoot` to the public folder of this project.

When using these configs, make sure that your data folder is inside the public folder in order to let apache/nginx serve the static content. e.g. `pr0clone/public/data`

## Contribute

Feel free to open issues or pull requests.

#### TODOs
- more error handling
- improve caching of API
- automatically delete old images
- Add caching parameters to webserver configs