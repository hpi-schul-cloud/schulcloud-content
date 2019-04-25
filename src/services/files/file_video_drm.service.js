const default_config = {
  process_manager : '@mediagoom/node-play/src/processor/procman.js'
  , destination : 'C:\\Users\\admin\\AppData\\Roaming\\.node_play'
  , dist_dir : 'C:\\Users\\admin\\MyStuff\\UNI\\BP\\schulcloud-content\\node_modules\\@mediagoom\\node-play\\dist'
  , status_man_use: '../processor/statmanfs.js'
  , processor_use: '../flows/processor.js'
  , def_owner: 'uploader'
  , root_dir: 'C:\\Users\\admin\\MyStuff\\UNI\\BP\\schulcloud-content\\node_modules\\@mediagoom\\node-play'
};
const config = default_config;
const ProcMan = require(config.process_manager);
const process_manager = new ProcMan(config);

const proccessor = require('@mediagoom/node-play/src/processor/statmanfs.js');


class VideoDrmService {
  constructor(app) {
    this.app = app;
  }
  async get(resourceId, obj/*{ query: queryParams }*/) {
    console.log(resourceId);
    console.log('Start Test');
    try {
      proccessor.queue_job('uploader'
      , '002546942265_SampleVideo_1280x720_5mb_mp4' 
      , 'C:\\Users\\admin\\AppData\\Roaming\\.node_play/uploader/SampleVideo_1280x720_5mb.mp4'
    ).then(()=>{
      return 'Done';
    });
    } catch (error) {
      console.log(error);
      return error;
    } 
  }
}

module.exports = {
  VideoDrmService
};
