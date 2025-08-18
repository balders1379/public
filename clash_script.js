// Define main function (script entry)
function main(config, profileName) {
  // 🌍 公共规则（所有订阅共用）
  const commonRules = [
    "DOMAIN-SUFFIX,okx.com,Exchange",
    "DOMAIN-SUFFIX,binance.com,Exchange",
    "DOMAIN-SUFFIX,tradingview.com,Exchange",
    "DOMAIN-SUFFIX,okcoin.com,Exchange",
    "DOMAIN-SUFFIX,kraken.com,Exchange",
    "DOMAIN-SUFFIX,wise.com,Exchange",
    "DOMAIN-SUFFIX,openai.com,AI",
    "DOMAIN-SUFFIX,chatgpt.com,AI",
    "IP-CIDR,43.248.101.179/32,Telegram,no-resolve",
    "DOMAIN-SUFFIX,google.com,Google",
    "DOMAIN-SUFFIX,googleusercontent.com,Google",
    "DOMAIN-SUFFIX,google-analytics.com,Google",
    "DOMAIN-SUFFIX,google.com.tw,Google",
    "DOMAIN-SUFFIX,google.com.hk,Google",
    "DOMAIN-SUFFIX,google.co.jp,Google",
    "DOMAIN-SUFFIX,youtube.com,YouTube",
    "DOMAIN-SUFFIX,youtubei.googleapis.com,YouTube",
    "DOMAIN-SUFFIX,youtube.com,YouTube",
    "DOMAIN-SUFFIX,googlevideo.com,YouTube",
    "DOMAIN-SUFFIX,twitter.com,Twitter",
    "DOMAIN-SUFFIX,twimg.com,Twitter",
    "DOMAIN-SUFFIX,github.com,Develop",
    "MATCH,Default"
  ];

  // 🌍 公共分组（所有订阅共用）
  const commonGroups = [
    { name: "Exchange", group: "日本" },
    { name: "AI", group: "美国省流" },
    { name: "Telegram", group: "日本省流" },
    { name: "Google", group: "日本省流" },
    { name: "YouTube", group: "日本省流" },
    { name: "Twitter", group: "日本省流" },
    { name: "Develop", group: "日本省流" },
  ];

  // 🔧 每个订阅的自定义分组（只管建组，规则统一用 commonRules）
  const extensions = {
    "ytoo": [
      { name: "Default", keyword: "" },
      { name: "日本", keyword: "日本![0.2]" },
      { name: "日本省流", keyword: "日本&[0.2]" },
      { name: "香港", keyword: "香港" },
      { name: "新加坡", keyword: "狮城" },
      { name: "台湾", keyword: "台湾" },
      { name: "美国", keyword: "美国" },
      { name: "美国省流", keyword: "美国&[0.2]" },
      { name: "欧洲", keyword: "德国|伦敦|法国|荷兰|西班牙|意大利" },
      { name: "省流", keyword: "[0.2]" },
      { name: "港+新", keyword: "香港|狮城" },   // OR 示例
    ],
    "juzi": [
      { name: "Default", keyword: "" },
      { name: "日本", keyword: "日本" },
      { name: "日本省流", keyword: "日本&[0.2]" },
      { name: "香港", keyword: "香港" },
      { name: "新加坡", keyword: "狮城" },
      { name: "台湾", keyword: "台湾" },
      { name: "美国", keyword: "美国" },
      { name: "美国省流", keyword: "美国&[0.2]" },
      { name: "欧洲", keyword: "德国|伦敦|法国|荷兰|西班牙|意大利" },
      { name: "省流", keyword: "[0.2]" },
      { name: "港+新", keyword: "香港|狮城" },   // OR 示例
    ],
  };

  const groups = extensions[profileName];
  if (!groups) {
    return config;
  }

  // 🚨 清空原有规则和代理组
  config.rules = [];
  config["proxy-groups"] = [];

  const groupNames = [];

  // 🔍 关键词匹配函数
  function matchByKeyword(proxyName, keyword) {
    // 分离排除项
    let [includePart, excludePart] = keyword.split("!");
    excludePart = excludePart ? excludePart.split("&") : [];
  
    let includeMatch = false;
  
    if (includePart.includes("&")) {
      // AND 逻辑
      includeMatch = includePart.split("&").every(k => proxyName.includes(k));
    } else if (includePart.includes("|")) {
      // OR 逻辑
      includeMatch = includePart.split("|").some(k => proxyName.includes(k));
    } else {
      // 单关键词
      includeMatch = proxyName.includes(includePart);
    }
  
    // 🚫 排除逻辑
    let excludeMatch = excludePart.some(k => proxyName.includes(k));
  
    return includeMatch && !excludeMatch;
  }

  // 遍历自定义分组
  groups.forEach((group) => {
    const matched = config.proxies
      .filter((p) => matchByKeyword(p.name, group.keyword))
      .map((p) => p.name);

    config["proxy-groups"].push({
      name: group.name,
      type: "url-test",   // 🚀 自动测速
      proxies: matched.length > 0 ? matched : ["DIRECT"],
      url: "http://www.gstatic.com/generate_204",
      interval: 300,
      tolerance: 50
    });

    groupNames.push(group.name);
  });

  // 🚀 总控组（包含所有区域分组，方便切换）
  commonGroups.forEach((group) => {
    config["proxy-groups"].push({
      name: group.name,
      type: "select",
      //proxies: [...groupNames, "DIRECT"],
      proxies: [group.group]
    });
  });

  // 公共规则
  config.rules = [...commonRules];

  return config;
}
