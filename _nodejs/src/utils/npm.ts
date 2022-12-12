import * as request from "request";

const npmApi = "https://hk.mybricks.world/api/npm";
const npmApiMap = {
  publish: `${npmApi}/publish`
}

/**
 * 云组件发布npm包
 * @param json 
 */
export function publishCloudComponentToNpm (json) {
  return new Promise((resolve) => {
    request({
      method: "POST",
      url: npmApiMap["publish"],
      headers: {
        "content-type": "application/json"
      },
      body: json,
      json: true
    }, (error, response, body) => {
      if (error || response.statusCode !== 200) {
        resolve(body);
      } else {
        resolve(body);
      }
    });
  })
}

