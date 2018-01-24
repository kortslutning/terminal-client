#!/usr/bin/env node

var FeedParser = require('feedparser');
var request = require('request');
var Speaker = require('speaker');
var lame = require('lame');
var inquirer = require('inquirer');

var req = request('https://rss.simplecast.com/podcasts/4239/rss');
var feedparser = new FeedParser();

var options = {
  channels: 2,
  bitDepth: 16,
  sampleRate: 44100
};

var decoder = new lame.Decoder(options);
var speaker = new Speaker(options);

req.on('error', function(error) {
  console.error(error);
  process.exit(1);
});

req.on('response', function(res) {
  var stream = this; // `this` is `req`, which is a stream

  if (res.statusCode !== 200) {
    this.emit('error', new Error('Bad status code'));
  } else {
    stream.pipe(feedparser);
  }
});

feedparser.on('error', function(error) {
  console.error(error);
  process.exit(1);
});

function getMp3(item) {
  return request(item.enclosures[0].url);
}

function startPlaying(item) {
  getMp3(item)
    .pipe(decoder)
    .pipe(speaker);
}

const items = [];
feedparser
  .on('readable', function() {
    // This is where the action is!
    var stream = this; // `this` is `feedparser`, which is a stream
    var meta = this.meta; // **NOTE** the "meta" is always available in the context of the feedparser instance
    var item;

    while ((item = stream.read())) {
      items.push(item);
    }
  })
  .on('finish', function() {
    selectSong(items);
  });

function selectSong(items) {
  inquirer
    .prompt([
      {
        type: 'list',
        name: 'episode',
        message: 'Which episode do you want to play?',
        choices: items.map(i => i.title)
      }
    ])
    .then(({ episode }) => {
      const episodeToPlay = items.find(i => i.title === episode);
      startPlaying(episodeToPlay);
    });
}
