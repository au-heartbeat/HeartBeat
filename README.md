# Heartbeat Project（2023/07）

[![Build status](https://badge.buildkite.com/94880b707695acea56c07125ec8e0d1220c746457d120ed022.svg)](https://buildkite.com/thoughtworks-Heartbeat/heartbeat)[![Codacy Badge](https://app.codacy.com/project/badge/Grade/2e19839055d3429598b2141884496c49)](https://www.codacy.com/gh/au-heartbeat/HeartBeat/dashboard?utm_source=github.com&utm_medium=referral&utm_content=au-heartbeat/HeartBeat&utm_campaign=Badge_Grade)[![Codacy Badge](https://app.codacy.com/project/badge/Coverage/2e19839055d3429598b2141884496c49)](https://www.codacy.com/gh/au-heartbeat/HeartBeat/dashboard?utm_source=github.com&utm_medium=referral&utm_content=au-heartbeat/HeartBeat&utm_campaign=Badge_Coverage)

[![Docs](https://github.com/au-heartbeat/HeartBeat/actions/workflows/Docs.yaml/badge.svg)](https://github.com/au-heartbeat/HeartBeat/actions/workflows/Docs.yaml) [![Frontend](https://github.com/au-heartbeat/HeartBeat/actions/workflows/frontend.yml/badge.svg)](https://github.com/au-heartbeat/HeartBeat/actions/workflows/frontend.yml) [![Backend](https://github.com/au-heartbeat/HeartBeat/actions/workflows/backend.yml/badge.svg)](https://github.com/au-heartbeat/HeartBeat/actions/workflows/backend.yml) [![Security](https://github.com/au-heartbeat/HeartBeat/actions/workflows/Security.yml/badge.svg)](https://github.com/au-heartbeat/HeartBeat/actions/workflows/Security.yml) [![Build and Deploy](https://github.com/au-heartbeat/HeartBeat/actions/workflows/BuildAndDeploy.yml/badge.svg)](https://github.com/au-heartbeat/HeartBeat/actions/workflows/BuildAndDeploy.yml)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

[![FOSSA Status](https://app.fossa.com/api/projects/custom%2B23211%2Fgithub.com%2Fau-heartbeat%2FHeartbeat.svg?type=large)](https://app.fossa.com/projects/custom%2B23211%2Fgithub.com%2Fau-heartbeat%2FHeartbeat?ref=badge_large)


* [News](#news)
* [About Heartbeat](#1-about-heartbeat)
* [Support tools](#2-support-tools)
* [Product Features](#3-product-features)
  * [Config project info](#31-config-project-info)
    * [Config Board/Pipeline/Source data](#311-config-boardpipelinesource-data)
    * [Config search data](#312-config-search-data)
    * [Config project account](#313-config-project-account)
  * [Config Metrics data](#32-config-metrics-data)
    * [Config Crews/Cycle Time](#321-config-crewscycle-time)
    * [Setting Classification](#322-setting-classification)
    * [Deployment Frequency/Lead Time for Changes](#323-deployment-frequencylead-time-for-changes)
  * [Export and import config info](#33-export-and-import-config-info)
    * [Export Config Json File](#331-export-config-json-file)
    * [Import Config Json File](#332-import-config-json-file)
  * [Generate Metrics Data](#34-generate-metrics-data)
    * [Velocity](#341-velocity)
    * [Cycle Time](#342-cycle-time)
    * [Classification](#343-classification)
    * [Deployment Frequency](#344-deployment-frequency)
    * [Lead time for changes Data](#345-lead-time-for-changes-data)
    * [Change Failure Rate](#346-change-failure-rate)
  * [Export original data](#35-export-original-data)
    * [Export board data](#351-export-board-data)
    * [Export pipeline data](#352-export-pipeline-data)
* [Known issues](#4-known-issues)
  * [Add/Delete columns in Jira board](#41-adddelete-columns-in-jira-board)
  * [No crew settings for Pipeline and Github](#42-no-crew-settings-for-pipeline-and-github)
  * [Change failure rate and MTTR](#43-change-failure-rate-and-mttr)
* [Instructions](#5-instructions)
  * [Prepare for Jira Project](#51-prepare-for-jira-project)
  * [Prepare env to use Heartbeat tool](#52-prepare-env-to-use-heartbeat-tool)
* [Run Heartbeat](#6-run-heartbeat)
  * [How to run frontend](#61-how-to-run-frontend)
    * [How to build it](#611-how-to-build-and-local-preview)
    * [How to run unit tests](#612-how-to-run-unit-tests)
    * [How to generate a test report](#613-how-to-generate-a-test-report)
    * [how to run e2e tests](#614-how-to-run-e2e-tests)
  * [How to run backend](backend/README.md)

* [How to use](#7-how-to-use)
    * [Docker-compose](#71-docker-compose)
      * [Customize story point field in Jira](#711-customize-story-point-field-in-jira)

# News

 - [Feb 28 2023 - Released Heartbeat - 0.9.0](release-notes/20230228.md)
 - [July 27 2023 - Release Heartbeat - 1.0.0](release-notes/20230726.md)
 - [Oct 9 2023 - Release Heartbeat - 1.1.0](release-notes/20231009.md)
 - [Nov 6 2023 - Release Heartbeat - 1.1.2](release-notes/20231106.md)
 - [Nov 21 2023 - Release Heartbeat - 1.1.3](release-notes/20231121.md)
 - [Dev 4 2023 - Release Heartbeat - 1.1.4](release-notes/20231204.md)

# 1 About Heartbeat

Heartbeat is a tool for tracking project delivery metrics that can help you get a better understanding of delivery performance. This product allows you easily get all aspects of source data faster and more accurate to analyze team delivery performance which enables delivery teams and team leaders focusing on driving continuous improvement and enhancing team productivity and efficiency.


State of DevOps Report is launching in 2019. In this webinar, The 4 key metrics research team and Google Cloud share key metrics to measure DevOps performance, measure the effectiveness of development and delivery practices. They searching about six years, developed four metrics that provide a high-level systems view of software delivery and performance.

**Here are the four Key meterics:**

1.  Deployment Frequency (DF)
2.  Lead Time for changes (LTC)
3.  Mean Time To Recover (MTTR)
4.  Change Failure Rate (CFR)

In Heartbeat tool, we also have some other metrics, like: Velocity, Cycle Time and Classification. So we can collect DF, LTC, CFR, Velocity, Cycle Time and Classification.

For MTTR meter, specifically, if the pipeline stay in failed status during the selected period, the unfixed part will not be included for MTTR calculation.

# 2 Support tools

Here is the user manaul for Version 1 on 2020/06. For now, we just can support Jira/Buildkite/Github to generate the corresponding metrics data.
| Type | Board | Pipeline | Repo |
| ------------- | --------------------- | ---------------------------------------- | -------------------------- |
| Support tools | Jira √ </br> Trello × | Buildkite √ </br>Teamcity × </br> GoCD × | Github √ </br> Bitbucket × |

**Note：** “√” means can support, “×” means can not support

# 3 Product Features

## 3.1 Config project info

### 3.1.1 Config Board/Pipeline/Source data

Before generator the metrics data, user need to config the project info, in Home page (Image3-1), you can create a new project for your project, or you can import a project config json file (If you already saved one config file, for import file feature will introduce in “Import and Export feature ”).

![Image 3-1](https://user-images.githubusercontent.com/995849/90855493-5b14e000-e3b2-11ea-9222-eba90c37e05e.png)\
_Image 3-1，home page_

#### 3.1.2 Config search data

If you are first use the product, you need to select “Create A New Project”，it will go to config page (Image 3-2)

![Image 3-2](https://user-images.githubusercontent.com/995849/90855655-bc3cb380-e3b2-11ea-8bed-28750ee26aae.png)\
_Image 3-2，Project config page_

Users need to select a period of time, then all of the data that follows is based on that time period.

**Have two items of time period:**

1.  **Regular Calendar(Weekend Considered):** If you select this item, it means all data will exclude the weekend.
2.  **Calendar with Chinese Holiday:** If you select this item, it means all data will exclude the weekend and Chinese holiday. So if the time period you selected contains Chinese holiday, you need to select this item.

All need to select which data you want to get, for now, we support seven metrics data (Image 3-3). Those seven metrics are `Deployment Frequency (DF)`, `Lead Time for changes (LTC)`, `Mean Time To Recover (MTTR)`, `Change Failure Rate (CFR)`, and `Velocity`, `Cycle time`, `Classification`, where
- `Velocity` : includes how many story points and cards we have completed within selected time period.
- `Cycle time`: the time it take for each card start to do until move to done.
- `Classification`: provide different dimensions to view how much efforts team spent within selected time period.


![Image 3-3](https://user-images.githubusercontent.com/995849/90855755-ef7f4280-e3b2-11ea-8b72-923f544db508.png)\
_Image 3-3，Metrics Data_

#### 3.1.3 Config project account

Because all metrics data from different tools that your projects use. Need to have the access to these tools then you can get the data. So after select time period and metrics data, then you need to input the config for different tools(Image 3-4).

According to your selected required data, you need to input account settings for the respective data source. Below is the mapping between your selected data to data source.

| Required Data  | Datasource  |
|---|---|
| Velocity  | Board  |
| Cycle time  | Board  |
| Classification  | Board  |
| Lead time for changes  | Repo，Pipeline  |
| Deployment frequency  | Pipeline |
| Change failure rate  | Pipeline  |
| Mean time to recovery  |  Pipeline |


![Image 3-4](https://user-images.githubusercontent.com/995849/90856214-0d00dc00-e3b4-11ea-9f51-7fc0bd6a5ab8.png)\
Image 3-4，Project config

**The details for board:**
|Items|Description|
|---|---|
|Board Type|Support two types of board: Classic Jira and Next-gen Jira|
|Board Id|The value of BoardId is number. You need to find it from your team’s Jira board URL.<br/>For Example: <br/> 1. Your jira board URL like below, then `2` is the boardId <br/> https://dorametrics.atlassian.net/jira/software/projects/ADM/boards/2 <br/> 2. Your jira board URL like below, then rapidView=3, `3` is the boardId <br/> https://pokergame.atlassian.net/secure/RapidBoard.jspa?projectKey=KAN1&useStoredSettings=true&rapidView=3 |
|ProjectKey|You can find it from your team’s Jira board URL. <br/> For Example: <br/> 1. Your jira board URL like below, then `ADM` is the projectkey <br/> https://dorametrics.atlassian.net/jira/software/projects/ADM/boards/2<br/> 2. Your jira board URL like below, then projectKey is `KAN1` <br/> https://pokergame.atlassian.net/secure/RapidBoard.jspa?projectKey=KAN1&useStoredSettings=true&rapidView=3 |
|Site|Site is the domain for your jira board, like below URL, `dorametrics` is the site <br/> https://dorametrics.atlassian.net/jira/software/projects/ADM/boards/2 |
|Email|The email can access to the Jira board |
|Token|Generate a new token with below link, https://id.atlassian.com/manage-profile/security/api-tokens |

**The details for Pipeline:**
|Items|Description|
|---|---|
|PipelineTool| The pipeline tool you team use, currently heartbeat only support buildkite|
|Token|Generate buildkite token with below link, https://buildkite.com/user/api-access-tokens|

**The details for SourceControl:**
|Items|Description|
|---|---|
|SourceControl|The source control tool you team use, currently heartbeat only support Github|
|Token|Generate Github token with below link(classic one), https://github.com/settings/tokens|

### 3.2 Config Metrics data

After inputting the details info, users need to click the `Verify` button to verify if can access to these tool. Once verified, they could click the `Next` button go to next page -- Config Metrics page(Image 3-5，Image 3-6，Image 3-7)

#### 3.2.1 Config Crews/Cycle Time

![Image 3-5](https://user-images.githubusercontent.com/995849/90856562-c6f84800-e3b4-11ea-80ea-f1a267f1dcd7.png)\
_Image 3-5, Crews/Cycle Time config_


**Crew Settings:** You could select your team members from a list get from board source. The list will include the assignees for those tickets that finished in the time period selected in the last step.

**Cycle Time:** It will list all columns for the current active jira board. Then users need to map the each column to the supported columns. Like, if your board have “in progress” column, it means developer doing this ticket, so it should be mapping with “In Dev” for the list we provide.

| Status              | Description                                                                                                                            |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| To do               | It means the ticket needs to be done, waiting for Dev to pick it. Cycle time doesn't include this time.                                |
| Analysis            | BA or other people still need to analyze the ticket. Cycle time doesn't include this time.                                             |
| In Dev              | It means dev is doing the ticket. This time should be a part of cycle time. And it is named development time.                          |
| Block               | It means the tickets blocked by some issues, cannot be done now. This time should be a part of cycle time. And it is named block time. |
| Waiting for testing | It means waiting for Dev to pick or QA to testing. This time should be a part of cycle time. And it is named waiting time.             |
| Testing             | It means QA is testing the tickets. This time should be a part of cycle time. And it is named testing time.                            |
| Review              | It means PO or other people are reviewing the tickets. This time should be a part of cycle time. And it is named review time.          |
| Done                | It means the tickets are already done. Cycle time doesn't include this time.                                                           |
| --                  | If you don't need to map, you can select --                                                                                            |

#### 3.2.2 Setting Classification

![Image 3-6](https://user-images.githubusercontent.com/995849/89784259-f56f5b00-db4a-11ea-8a58-d6238e81df3c.png)\
_Image 3-6，Classification Settings_

In classification settings, it will list all Context fields for your jira board. Users can select anyone to get the data for them. And according to your selection, in the export page, you will see the classification report to provide more insight with your board data.

#### 3.2.3 Deployment Frequency/Lead Time for Changes

![Image 3-7](https://user-images.githubusercontent.com/995849/89784260-f6a08800-db4a-11ea-8ce2-87983363aa18.png)\
_Image 3-7，Settings for Pipeline_

They are sharing the similar settings which you need to specify the pipeline step so that Heartbeat will know in which pipeline and step, team consider it as deploy to PROD. So that we could use it to calculate metrics.

| Items         | Description                         |
| ------------- | ----------------------------------- |
| Organization  | The organization for your pipelines |
| Pipeline Name | Your pipeline name                  |
| Steps         | The pipeline step that consider as deploy to PROD            |

## 3.3 Export and import config info

### 3.3.1 Export Config Json File

When user first use this tool, need to create a project, and do some config. To avoid the user entering configuration information repeatedly every time, we provide a “Save” button in the config and metrics pages. In config page, click the save button, it will save all items in config page in a Json file. If you click the save button in the metrics page, it will save all items in config and metrics settings in a Json file. Here is the json file (Image 3-8)。Note: Below screenshot just contains a part of data.

![Image 3-8](https://user-images.githubusercontent.com/995849/89784710-b4c41180-db4b-11ea-9bc4-db14ce98ef69.png)\
_Image 3-8, Config Json file_

### 3.3.2 Import Config Json File

When user already saved config file before, then you don’t need to create a new project. In the home page, can click Import Project from File button(Image 3-1) to select the config file. If your config file is too old, and the tool already have some new feature change, then if you import the config file, it will get some warning info(Image 3-9). You need to re-select some info, then go to the next page.

![Image 3-9](https://user-images.githubusercontent.com/995849/89784267-f902e200-db4a-11ea-9d0b-a8ab29a8819e.png)\
_Image 3-9, Warning message_

## 3.4 Generate Metrics Data

After config, then it will generate the report for you.

### 3.4.1 Velocity

In Velocity Report, it will list the corresponding data by Story Point and the number of story tickets. (image 3-10)
![Image 3-10](https://user-images.githubusercontent.com/995849/90856819-5ef63180-e3b5-11ea-8e94-e5363d305cf1.png)\
_Image 3-10，Velocity Report_

### 3.4.2 Cycle Time

The calculation process data and final result of Cycle Time are calculated by rounding method, and two digits are kept after the decimal point. Such as: 3.567... Is 3.56; 3.564... Is 3.56.

![Image 3-11](https://user-images.githubusercontent.com/995849/89784273-fbfdd280-db4a-11ea-9185-da89a862dace.png)\
_Image 3-11，Cycle Time Report_

### 3.4.3 Classification


It will show the classification data of Board based on your selection on `Classification Settings` in metrics page.
The percentage value represent the count of that type tickets vs total count of tickets.


![Image 3-12](docs/img/Classification-Export.png)\
_Image 3-12，Classification Report_

### 3.4.4 Deployment Frequency

![Image 3-13](https://user-images.githubusercontent.com/995849/89784281-fef8c300-db4a-11ea-992b-6e2eca426f53.png)\
_Image 3-13，Deployment Frequency Report_

### 3.4.5 Lead time for changes Data

![Image 3-14](https://user-images.githubusercontent.com/995849/89784283-ff915980-db4a-11ea-83b3-304372e8749a.png)\
_Image 3-14，Lead time for changes Report_

### 3.4.6 Change Failure Rate

![Image 3-15](https://user-images.githubusercontent.com/995849/89784288-00c28680-db4b-11ea-9756-878176148d63.png)\
_Image 3-15，Change Failure Rate Report_

## 3.5 Export original data

After generating the report, you can export the original data for your board and pipeline (Image 3-15). Users can click the “Export board data” or “Export pipeline data” button to export the original data.

### 3.5.1 Export board data

It will export a csv file for board data. It contains two parts:
**Part 1:** Export the all done tickets during the time period
**Part 2:** Export the all non-done tickets in your current active board. And it will order by ticket status (Image 3-16)

![Image 3-16](https://user-images.githubusercontent.com/995849/89784291-01f3b380-db4b-11ea-8f5a-d475e80014fb.png)\
_Image 3-16，Exported Board Data_

**All columns for Jira board:**
|Column name |Description|
|---|---|
|Issue key|Ticket ID|
|Summary|--|
|Issue Type|-- |
|Status|--|
|Story Point|--|
|Assignee|--|
|Reporter|--|
|Project Key|--|
|Project Name|--|
|Priority|--|
|Parent Summary|The epic for ticket|
|Sprint|Which sprint this ticket in |
|Labels|--|
|Cycle Time|total Cycle Time|
|Cycle Time / Story Points|Cycle Time for each point|
|Analysis Days|Analysis days for each ticket|
|In Dev Days|Development days for each ticket |
|Waiting Days|After development, how long will take before testing|
|Testing Days|Testing days for each ticket |
|Block Days|Blocked days for each ticket|
|Review Days|--|
|Original Cycle Time: {Column Name}|The data for Jira board original data |

### 3.5.2 Export pipeline data

It will export a csv file for pipeline data (image 3-17).

![Image 3-17](https://user-images.githubusercontent.com/995849/89784293-0324e080-db4b-11ea-975d-6609024aac49.png)\
_Image 3-17，Exported Pipeline Data_

**All columns for pipeline data:**
|Column name |Description|
|---|---|
|Pipeline Name|--|
|Pipeline Step|Step name |
|Committer|--|
|Code Committed Time|Committed time |
|PR Created Time|-- |
|PR Merged Time|-- |
|Deployment Completed Time|When it finished deploy |
|Total Lead Time (mins)|--|
|PR lead time (mins)|--|
|Pipeline lead time (mins)|--|
|Status|Status for pipeline (Pass or Failed)|

# 4 Known issues

## 4.1 Add/Delete columns in Jira board

In the current version, if you add or delete some columns for the jira board, it will change finish time for all last column tickets to add/delete column time. (It just impact Next-gen Jira), here are the details info:

| Jira Template | Add column                                                                                                                                | Delete column                                                                                                                                                                                                                   |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Kanban        | It will change finish time for all last column tickets to add/delete column time                                                          | If delete non-last column: It will change finish time for all last column tickets to add/delete column time<br/>If delete the last column: It will change finish time for current last column tickets to add/delete column time |
| Scrum         | finish time for all last column tickets to add/delete column time<br/>All finished ticket’s finish time changed to add/delete column time | If delete the last column: It will change finish time for current last column tickets to add/delete column time                                                                                                                 |


## 4.2 No crew settings for Pipeline and Github
In case that not only your team but also other team was contributing on the same repo and pipeline, the metrics (`Lead time for change`, `deployment frenquency`, `change failure rate`, `mean time to recovery`) might not be as accurate which might include the other team's contribution. Because currently Heartbeat could't not differentiate which pipeline trigger by your team or other team within specified time range. The feature is still under development.

## 4.3 Change failure rate and MTTR
Currently the calculated metrics for change failure rate might not be precise in some scenarios.
And MTTR is still under development.


# 5 Instructions

## 5.1 Prepare for Jira Project

For Classic Jira users, before you use this tool, you need to do some settings for the jira board. Otherwise, you cannot get the data. Here are the steps you need to do:

1.  Open https://{site}.atlassian.net/secure/admin/ViewIssueFields.jspa?start=0&searchFilter=
    ![Image 5-1](https://user-images.githubusercontent.com/995849/89785230-a75b5700-db4c-11ea-9ce2-4ff7894bbf25.png)\
    _Image 5-1_

2.  You need to enable any items you want to know. In the above page, If you want to change any items' screens, you can click the screens link in the actions column for that item. Then in the next page, check the project you want to change, and update it. Like: Story points

- ![Image 5-2](https://user-images.githubusercontent.com/995849/89785239-ab877480-db4c-11ea-9e82-952777936cf8.png)\
  _Image 5-2_

- ![Image 5-3](https://user-images.githubusercontent.com/995849/89785244-acb8a180-db4c-11ea-958f-663a7efa105c.png)\
  _Image 5-3_

For the next-gen Jira, when you add story points item, the name should be Story Points or Story point estimate.

## 5.2 Prepare env to use Heartbeat tool

For now, we just can download the code in our local machine, please follow below steps:

1.  Clone the backend code in your local machine: https://github.com/thoughtworks/HeartBeat/
2.  Follow the steps as below

# 6 Run Heartbeat

## 6.1 How to run frontend

```
cd HearBeat/frontend
pnpm install
pnpm start
```

## 6.1.1 How to build and local preview

```
pnpm build
pnpm preview
```

## 6.1.2 How to run unit tests

```
pnpm test
```

## 6.1.3 How to generate a test report

```
pnpm coverage
```

## 6.1.4 How to run e2e tests locally
1. Start the mock server
```
cd HearBeat/stubs
docker-compose up -d
```
2. Start the backend service
```
cd HearBeat/backend
./gradlew bootRun --args='--spring.profiles.active=local --MOCK_SERVER_URL=http://localhost:4323'
```
3. Start the frontend service
```
cd HearBeat/frontend
pnpm start
```
4. Run the e2e tests
```
cd HearBeat/frontend
pnpm e2e
```

# 7 How to trigger BuildKite Pipeline
1. Add `[stub]` tag to the title of a commit message or PR to trigger stub-related deployments.

2. Add `[infra]` tag to the title of the commit message or PR to trigger infra-related deployments.

3. Add `[backend]` tag to the title of the commit message or PR to trigger backend-related deployments.

4. Add `[frontend]` tag to the title of the commit message or PR to trigger frontend-related deployments.

5. Add `[docs]` tag to the title of the commit message or PR to trigger docs-related deployments.


## Release

Release version follows  **[Software release life cycle](https://en.wikipedia.org/wiki/Software_release_life_cycle)**

### Release command in main branch

```sh
git tag {tag name}
git push origin {tag name}

# Delete tag
git tag -d {tag name}
git push origin :refs/tags/{tag name}
```

# 7 How to use

## 7.1 Docker-compose

First, create a `docker-compose.yml` file, and copy below code into the file.

```yaml
version: "3.4"

services:
  backend:
    image: ghcr.io/au-heartbeat/heartbeat_backend:latest
    container_name: backend
    ports:
      - 4322:4322
    restart: always
  frontend:
    image: ghcr.io/au-heartbeat/heartbeat_frontend:latest
    container_name: frontend
    ports:
      - 4321:80
    depends_on:
      - backend
    restart: always
```

Then, execute this command

```sh
docker-compose up -d frontend
```

### 7.1.1 Customize story point field in Jira
Specifically, story point field can be indicated in `docker-compose.yml`. You can do it as below.
```yaml
version: "3.4"

services:
  backend:
    image: ghcr.io/au-heartbeat/heartbeat_backend:latest
    container_name: backend
    ports:
      - 4322:4322
    restart: always
    environment:
      STORY_POINT_KEY: customfield_10061
  frontend:
    image: ghcr.io/au-heartbeat/heartbeat_frontend:latest
    container_name: frontend
    ports:
      - 4321:80
    depends_on:
      - backend
    restart: always
```
