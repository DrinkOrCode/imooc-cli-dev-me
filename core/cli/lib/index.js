"use strict";
//require :.js/.json/.node
//.js->module.exports /exports
//.json->JSON.parse
//any(其他任何文件)=>默认.js文件解析   !重点
//.node->process.dlopen
module.exports = core;
const command = require("commander");
const program = new command.Command();

const path = require("path");
const semver = require("semver");
const userHome = require("user-home");
const pkg = require("../package.json");
const colors = require("colors/safe");
const constant = require("./const");

const log = require("@lerna-cli-dev/log");
const init=require('@lerna-cli-dev/init')
let args;
async function core() {
  try {
    checkPkgVersion();
    checkNodeVersion();
    checkUserHome();
    // checkInputArgs();
    checkEnv();
    await checkGlobalUpdate();
    registerCommand();
  } catch (error) {
    log.error(error.message);
  }
}

function registerCommand() {
  program
    .name(Object.keys(pkg.bin)[0])
    .usage("<command> [options]")
    .version(pkg.version)
    .option("-d, --debug", "是否开启调试模式", false);

    program
    .command('init [projectName]')
    .option('-f ,--force','是否强制初始化项目')
    .action(init)

  //开启debug模式
  program.on("option:debug", function () {
    if (program.opts().debug) {
      process.env.LOG_LEVEL = "verbose";
    } else {
      process.env.LOG_LEVEL = "info";
    }
    log.level = process.env.LOG_LEVEL;
    log.verbose('test')
  });
  //对未知命令监听
  program.on("command:*", function (obj) {
    const availableCommands = program.commands.map((cmd) => cmd.name());
    console.log(colors.red("未知的命令" + obj[0]));
    if (availableCommands.length > 0) {
      console.log(colors.red("可用命令" + availableCommands.join(",")));
    }
  });
  program.parse(process.argv);

  if (program.args&&program.args.length<1) {
    program.outputHelp();
    console.log();
  }
}
// async function checkInputArgs() {
//   args = require("minimist")(process.argv.slice(2));
//   checkArgs();
// }

function checkArgs() {
  if (args.debug) {
    process.env.LOG_LEVEL = "verbose";
  } else {
    process.env.LOG_LEVEL = "info";
  }
  log.level = process.env.LOG_LEVEL;
}
function checkPkgVersion() {
  log.info("cli", pkg.version);
}

function checkNodeVersion() {
  const currentVersion = process.version;
  const lowestVersion = constant.LOWEST_NODE_VERSION;

  if (!semver.gte(currentVersion, lowestVersion)) {
    throw new Error(
      colors.red(`lerna-cli 需要安装 v${lowestVersion} 以上版本的 Node.js`)
    );
  }
}

async function checkUserHome() {
  const pathExists = await import("path-exists");

  if (!userHome || !pathExists.pathExists(userHome))
    throw new Error(colors.red("当前登录用户主目录不存在!"));
}

async function checkEnv() {  
      const dotenv = require("dotenv");
  const dotenvPath = path.resolve(userHome, ".env");

  const pathExists = await import("path-exists");

  if (pathExists.pathExists(dotenvPath)) {
    dotenv.config({
      path: dotenvPath,
    });
  }
  createDefaultConfig();
  log.verbose("环境变量", process.env.CLI_HOME_PATH);
}

function createDefaultConfig() {

  const cliConfig = {
    home: userHome,
  };
  if (process.env.CLI_HOME) {

    cliConfig["cliHome"] = path.join(userHome, process.env.CLI_HOME);
  } else {
    cliConfig["cliHome"] = path.join(userHome, constant.DEFAULT_CLI_HOME);
  }
  process.env.CLI_HOME_PATH = cliConfig.cliHome;
  console.log(cliConfig)
  return cliConfig;
}

async function checkGlobalUpdate() {
  //1.获取当前版本号和模块名
  //2.调用npm API，获取所有版本号
  //3.提取所有版本号，比对哪些版本号是大于当前版本号
  //4.获取最新版本号，提示用户更新到该版本
  const currentVersion = pkg.version;
  const npmName = pkg.name;
  const { getNpmSemverVersion } = require("@lerna-cli-dev/get-npm-info");
  const lastVersion = await getNpmSemverVersion(currentVersion, npmName);
  if (lastVersion && semver.gt(lastVersion, currentVersion)) {
    log.warn(
      "更新提示:",
      colors.yellow(`请手动更新${npmName},当前版本：${currentVersion},最新版本：
  ${lastVersion}
                     更新命令：npm install -g ${npmName}
  `)
    );
  }
}
