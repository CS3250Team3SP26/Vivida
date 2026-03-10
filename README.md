# Team-3-CS-3250 - The StackTracers
A Firfox broswer extension that allows users to organize themes into groups and switch between them. Built for CS2050( Software Dev Methods and Tools)



#### Project Structure Decisions

├── src/
│   ├── manifest.json              # Extension manifest (Manifest V2)
│   ├── background/
│   │   └── background.js          # Message routing hub
│   ├── popup/
│   │   ├── popup.html / .css / .js
│   ├── options/
│   │   ├── options.html / .css / .js
│   └── lib/
│       ├── Group.js               # Data model for a theme group
│       ├── GroupManager.js        # Business logic for managing groups
│       ├── themeGroupsManager.js  # In-memory state + persistence manager
│       ├── storageServiceWrapper.js  # browser.storage abstraction
│       └── themeAPI.js            # Firefox theme API wrapper
├── test/                          # Jest test files
├── icons/                         # Extension icons (16, 32, 48, 128px)
├── package.json
└── .github/workflows/ci.yml       # GitHub Actions CI pipeline

##### Agile Method



We have chosen to use Scrumban as our agile method. We found it to have the best qualities of both Kanban and Scrum. We will be implementing our "whiteboard" inside of GitHub projects.

* Scrum Master
* Project Owner
* Developers



#### Out of Class Communication


Discord - organized into channels by topic for reliable coordination



#### CI/CD



Our plan is to use GitHub actions for our CI/CD to keep all of our resources centralized and accessible in GitHub.
The Pipeline(for every push):
* Checks out code
* Sets up Node.js 20
* Installs dependencies (npm ci)
* Runs ESLint (npm run lint)
* Runs Jest with coverage (npm run test:coverage)
* Generates JSDoc documentation (npm run docs)

A failed step delays PR from merging





#### Local Static Analysis



For local static analysis we will be utilizing eslint and prettier to monitor our code quality and formatting. These were easily accessible in vsCode extensions We will also use SonarCloud for code quality and efficiency.



#### API documentation



We will be using the built in functionality of jsdoc in vsCode to create and maintain our API documentation.



#### JavaScript Test Framework



We plan on using Jest to create of test framework.



#### Definition of Done



Our project will be complete when we create a Firefox extension that is able to create and name groups of browser themees, switch between active by selecting a group, manage groups from a dedicated optins page.


In addition to this we will:

* Have no known defects
* 90%+ unit test code coverage
* 100% of API documented
* User documentation up to date

