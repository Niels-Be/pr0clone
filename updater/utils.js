var fs = require('fs');
var path = require('path');
 
fs.mkdirParent = function(dirPath, mode, callback) {
  //Call the standard fs.mkdir
  fs.mkdir(dirPath, mode, function(error) {
    //When it fail in this way, do the custom steps
    if (error && error.errno === -2) {
      //Create all the parents recursively
      fs.mkdirParent(path.dirname(dirPath), mode, () => {
        //And then the directory
        fs.mkdir(dirPath, mode, callback);
      });
    } else {
        //Manually run the callback since we used our own callback to do all these
        callback && callback(error);   
    }
  });
};
