# Eve_Industry_Calculator

http://www.eveic.com

Eve Industry Calculator is a simple industry tool web app for the mmorpg Eve Online.

In order to set up a developer environment to work on this project, please first clone this repository and follow the following steps.
1. Obtain the current SDE from https://developers.eveonline.com/resource/resources and convert to MySQL, or obtain a freely available pre converted version, and host that at an accessible location
2. Obtain the "Types" image Export collection also from https://developers.eveonline.com/resource/resources and extract the Types directory into frontend/src/images/Types/
3. Modify the connecttemplate.php file found in backend/ to match your MySQL database information and rename it to connect.php, this file is in the .gitignore to protect your account information.
4. Host the backend directory using a PHP compatible server
5. Modify frontend/src/api-config.js to reflect your backend hosting location
6. Navigate to the frontend directory and run npm install to install all directories
7. You can now run npm start in the frontend directory to run your own local version of Eve Industry Calculator
