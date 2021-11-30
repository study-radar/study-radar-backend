# Study Radar

Study Radar is a full-stack website project bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Setting up the development environment 

### Install Postgres

Install postgres command line: ``brew install postgresql``\
Run: ``psql -U postgres -f studyradar.sql ``\
When it asks for the password: enter "postgres"

### Alternative way to install Postgres

If the above instruction doesn't work for you, visit [Download PostgreSQL on Mac](https://postgresapp.com/downloads.html).\
Follow instructions on the website to download Postgres.\
Launch Postgres and follow the next steps to connect to the database.

### Connect to the database

Clone this repo with `https://github.com/study-radar/study-radar-backend.git`.\
Change into study-radar-backend directory with `cd study-radar-backend`.\
Run `npm install` to install the project's dependencies.\
Run `npm start` to start the server.\
To see the website, please visit [study-radar-frontend repository](https://github.com/study-radar/study-radar-frontend).

## Using Study Radar

Remember to connect to the frontend by following instructions at [study-radar-frontend repository](https://github.com/study-radar/study-radar-frontend).\
Login or signup to enter homepage.\
Create a new study group event using the `CREATE EVENT` tag on the navbar.\
Your events will show up on your homepage.\
Find a study group to join or leave a study group by clicking the `EXPLORE` tag on the navbar.\
Your events will be recorded on the agenda on the right side of the page.

## Potential issues

If you are getting authentication failed when typing in your password to the command line, try adding the `-U postgres` flag.

## Other notes

This project is the Final Project for UCLA's CS35L Software Construction course. Please feel free to fork and adjust to your needs/wants.
