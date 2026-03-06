# MySQL, PHPMyAdmin and Node.js (ready for Express development)

This will install Mysql and phpmyadmin (including all dependencies to run Phpmyadmin) AND node.js

This receipe is for development - Node.js is run in using supervisor: changes to any file in the app will trigger a rebuild automatically.

In node.js, we use the MySQl2 packages (to avoid problems with MySQL8) and the dotenv package to read the environment variables.

Local files are mounted into the container using the 'volumes' directive in the docker-compose.yml for ease of development.

### Super-quickstart your new project:

* Make sure that you don't have any other containers running using 
docker ps

if you see any containers running, stop them using 
docker stop <container name>

or ```docker-compose down ``` 
after that we can run our container

* run ```docker-compose up --build```

if this does not work for you then, you need to start the docker container from the docker desktop manually.

#### Visit phphmyadmin at:

http://localhost:8081/

#### Visit your express app at:

http://localhost:3000/about.html


### Whats provided in these scaffolding files?


  * A docker setup which will provide you with node.js, mysql and phpmyadmin, including the configuration needed so that both node.js AND phpmyadmin can 'see' and connect to your mysql database.  If you don't use docker you'll have to set up and connect each of these components separately.
  * A basic starting file structure for a node.js app.
  * A package.json file that will pull in the node.js libraries required and start your app as needed.
  * A db.js file which provides all the code needed to connect to the mysql database, using the credentials in the .env file, and which provides a query() function that can send queries to the database and receive a result.  In order to use this (ie. interact with the database, you simply need to include this file in any file you create that needs this database interaction) with the following code:

```const db = require('./services/db');
```

____

Useful commands:

Get a shell in any of the containers

```bash
docker exec -it <container name> bash -l
```

Once in the database container, you can get a MySQL CLI in the usual way

```bash
mysql -uroot -p<password> 
```

### Mac Users (Apple Silicon)

If you are using a Mac with an M1, M2, or M3 chip and encounter issues with the MySQL container, you may need to specify the platform in your `docker-compose.yml` file.

Add `platform: linux/amd64` to the `db` service:

```yaml
  db:
    image: mysql
    platform: linux/amd64  # Add this line
    # ... rest of configuration
```

### Possible Errors

if you get any errors, due to env files you need to create a .env file in the root directory of the project, and copy paste the contents of the .env.sample file into it, and then modify the values to match your own.

for you reference, the .env file should look like this:

```bash
MYSQL_HOST=localhost
MYSQL_USER=admin
MYSQL_PASS=password
MYSQL_ROOT_PASSWORD=password
MYSQL_DATABASE=sd2-db
MYSQL_ROOT_USER=root
DB_CONTAINER=db
DB_PORT=3306
```
___

## 🚀 IntelliJ IDEA Setup (Recommended)

To set up the entire project (Node.js + JavaFX) in IntelliJ:

1. **Open the Project**: Select **File -> Open** and choose the root `Dracarys` folder.
2. **Import as Maven**: IntelliJ should detect the root `pom.xml`. If prompted, click **"Import Maven Project"** or **"Load Maven Project"**.
3. **Run Configurations**: We've included pre-configured run actions:
   - Select **"Start Express Server"** from the run dropdown and click the green arrow to start the Node.js backend.
   - Select **"Run JavaFX Lab"** to launch the Java graphical interface.

> [!NOTE]
> For the JavaFX lab, ensure you use **JDK 21 or higher** for best compatibility with macOS Sequoia.
