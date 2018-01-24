#!/usr/bin/env node

const podcast = 4239;
const inquirer = require('inquirer');
const Speaker = require('speaker');
const request = require('request');
const lame = require('lame');
const bent = require('bent');
const ora = require('ora');

const getJson = bent('json');

function getEpisodes() {
  return getJson(
    `https://kortslutning-server-qtoearljfv.now.sh/v1/podcasts/${podcast}/episodes.json`
  );
}

var options = {
  channels: 2,
  bitDepth: 16,
  sampleRate: 44100
};

const decoder = new lame.Decoder(options);
const speaker = new Speaker(options);

getEpisodes().then(selectSong);

function getMp3(item) {
  return request(item.audio_url);
}

function startPlaying(item) {
  ora({
    text: `Playing ${item.title}`,
    spinner: 'simpleDotsScrolling'
  }).start();

  getMp3(item)
    .pipe(decoder)
    .pipe(speaker);
}

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
