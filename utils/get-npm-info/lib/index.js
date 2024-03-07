"use strict";

const axios = require("axios");

const semver = require("semver");
async function getNpmInfo(npmName, registry) {
  if (!npmName) {
    return null;
  }
  const urlJoin = await import("url-join");

  const registryUrl = registry || getDefaultRegistry();
  const npmInfoUrl = urlJoin.default(registryUrl, npmName);
  console.log(npmInfoUrl)
  return axios
    .get(npmInfoUrl)
    .then((response) => {
      if (response.status === 200) {
        return response.data;
      } else {
        return null;
      }
    })
    .catch((err) => {
      return Promise.reject(err);
    });
}
function getDefaultRegistry(isOriginal = false) {
  return isOriginal
    ? "https://registry.npmjs.org"
    : "http://registry.npmmirror.com";
}

async function getNpmVersions(npmName, registry) {
  const data = await getNpmInfo(npmName, registry);
  if (data) {
    return Object.keys(data.versions);
  } else {
    return [];
  }
}

function getNpmSemverVersions(baseVersion, versions) {
  versions = versions.filter(
    (version) =>
      semver.valid(version) && semver.satisfies(version, `^${baseVersion}`)
  );

  // 根据语义化版本号降序排序
  versions.sort((a, b) => semver.rcompare(a, b));
  return versions;
}

async function getNpmSemverVersion(baseVersion, npmName, registry) {
  const versions = await getNpmVersions(npmName, registry);
  const newVersions = getNpmSemverVersions(baseVersion, versions);
  if (newVersions && newVersions.length > 0) {
    return newVersions[0];
  }
  return null;
}
module.exports = {
  getNpmInfo,
  getNpmVersions,
  getNpmSemverVersion,
};
