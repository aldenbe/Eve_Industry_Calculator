# Eve_Industry_Calculator

http://www.eveic.com

Eve Industry Calculator is an increasingly complex industry tool web app for the mmorpg Eve Online.

In order to set up a developer environment to work on this project, please first clone this repository and follow the following steps.
1. Obtain the current SDE from https://developers.eveonline.com/resource/resources and convert to MySQL, or obtain a freely available pre converted version, and host that at an accessible location
2. Modify the securevariablestemplate.php file found in backend/ to match your MySQL database information and rename it to securevariables.php, this file is in the .gitignore to protect your account information.
3. Host the backend directory using a PHP compatible server
4. Modify frontend/src/APIConfig.js to reflect your backend hosting location
5. Navigate to the frontend directory and run npm install to install all dependencies
6. You can now run npm start in the frontend directory to run your own local version of Eve Industry Calculator

There is a discord server for this project, feel free to join and propose features or request the developer role if you would like to contribute. https://discord.gg/SjfVrfz

If you would like to support the development of EVEIC please donate isk to EVEIC in game.
