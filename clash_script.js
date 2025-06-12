// extend.js
function main(config) {
  rules_map = {
      "Exchange" : [
          "okx.com",
          "tradingview.com",
          "gmgn.ai"
      ],
      "Transfer" : [
          "ifastgb.com",
          "kraken.com",
          "walletconnect.org"
      ],
      "AI" : [
          "chatgpt.com",
          "openai.com"
      ],
      "Telegram" : [
          "telegram.org",
          "149.154.175.50/8",
          "91.108.56.102/8"
      ],
      "Google" : [
          "google.com",
          "google.com.hk",
          "googletagmanager.com",
          "googleusercontent.com",
          "youtube.com",
          "googlevideo.com",
          "ytimg.com",
          "ggpht.com",
          "withgoogle.com",
          "gmail.com",
          "gstatic.com",
          "google-analytics.com",
          "clarity.ms",
          "github.com",
          "publiciptv.com",
          "bbci.co.uk"
      ],
      "Germany" : [
        "vodafone.de",
        "vodafone.com",
        "n26.com"
      ],
      "Plugin" : [
        "intercom.io",
        "yandex.ru",
        "doubleclick.net"
      ],
      "CDN" : [
        "oaistatic.com"
      ]
  };
  
  rules_other = [
    "MATCH, ✈️Final"
  ];
  
  // 自动获取所有节点名
  let allProxies_wifi = [];
  let allProxies_ethernet = [];
  
  // 如果配置中有 proxies 字段（静态节点）Wi-Fi
  let proxies_wifi = [];
  if (Array.isArray(config.proxies)) {
    proxies_wifi = config.proxies.map(proxy => ({
      ...proxy,
      "interface-name": "Wi-Fi"
    }));
    for (const proxy of proxies_wifi) {
      if (proxy.name) allProxies_wifi.push(proxy.name);
    }
  }
  // 如果配置中有 proxies 字段（静态节点）以太网
  let proxies_ethernet = [];
  if (Array.isArray(config.proxies)) {
    proxies_ethernet = config.proxies.map(proxy => ({
      ...proxy,
      "interface-name": "Ethernet"
    }));
    for (const proxy of proxies_ethernet) {
      if (proxy.name) allProxies_ethernet.push(proxy.name);
    }
  }

  config["proxies"] = proxies_wifi;
  
  // 如果是 proxy-providers 模式（更常见）
  if (config["proxy-providers"]) {
    for (const provider of Object.values(config["proxy-providers"])) {
      if (provider.proxies && Array.isArray(provider.proxies)) {
        for (const proxy of provider.proxies) {
          if (proxy.name) allProxies_wifi.push(proxy.name);
        }
      }
    }
  }

  fallback_url = "http://www.gstatic.com/generate_204";
  
  config["rules"] = [];
  config["proxy-groups"] = [{
    name: "Default",
    type: "fallback",
    proxies: proxies_filter(allProxies_wifi, "低倍率", null),
    url: fallback_url,
    interval: 300
  }];
  
  for (let rule_name in rules_map) {
    let rule_array = [];
    for (let rule of rules_map[rule_name]) {
      // IPv4地址
      if (isIPv4WithMask(rule)) {
        rule_array.push("IP-CIDR," + rule + "," + rule_name + ",no-resolve");
      }
      // IPv6地址
      if (isIPv6WithMask(rule)) {
        rule_array.push("IP-CIDR6," + rule + "," + rule_name + ",no-resolve");
      }
      // 域名
      else {
        rule_array.push("DOMAIN-SUFFIX," + rule + "," + rule_name);
      }
    }
    config["rules"] = config["rules"].concat(rule_array);
    if (rule_name == "Transfer") {
      config["proxy-groups"].push({
        name: rule_name,
        type: "fallback",
        proxies: proxies_filter(allProxies_wifi, "英国", "低倍率"),
        url: fallback_url,
        interval: 300
      });
    } else if (rule_name == "Germany") {
      config["proxy-groups"].push({
        name: rule_name,
        type: "fallback",
        proxies: proxies_filter(allProxies_wifi, "德国", null),
        url: fallback_url,
        interval: 300
      });
    } else if (rule_name == "AI") {
      config["proxy-groups"].push({
        name: rule_name,
        type: "fallback",
        proxies: proxies_filter(allProxies_wifi, "美国", "低倍率"),
        url: fallback_url,
        interval: 300
      });
    } else if (rule_name == "Exchange") {
      config["proxy-groups"].push({
        name: rule_name,
        type: "fallback",
        proxies: proxies_filter(allProxies_wifi, "日本", "低倍率"),
        url: fallback_url,
        interval: 300
      });
    } else if (["Plugin", "CDN"].includes(rule_name)) {
      config["proxy-groups"].push({
        name: rule_name,
        type: "fallback",
        proxies: proxies_filter(allProxies_wifi, "低倍率", null),
        url: fallback_url,
        interval: 300
      });
    } else {
      config["proxy-groups"].push({
        name: rule_name,
        type: "select",
        proxies: ["Default", ...allProxies_wifi]
      });
    }
  }
  
  config["proxy-groups"].push({
    name: "✈️Final",
    type: "fallback",
    proxies: proxies_filter(allProxies_wifi, "低倍率", null),
    url: fallback_url,
    interval: 300
  });
  config["rules"] = config["rules"].concat(rules_other);
  
  return config;
}

function proxies_filter(all_proxies, include, exclude) {
  // 统一为数组处理
  include = Array.isArray(include) ? include : [include];
  exclude = Array.isArray(exclude) ? exclude : [exclude];

  let result = all_proxies.filter(p => {
    // 必须包含 include 中所有关键词
    const include_ok = include.every(key => new RegExp(key, 'i').test(p));

    // 不得包含 exclude 中任一关键词
    const exclude_ok = exclude.every(key => !new RegExp(key, 'i').test(p));

    return include_ok && exclude_ok;
  });

  // 如果筛不到任何节点，则返回全部，避免出错
  return result.length > 0 ? result : all_proxies;
}

function isIPv4WithMask(rule) {
  // Check if the string matches IPv4 CIDR notation (e.g., 127.0.0.0/8)
  const parts = rule.split('/');
  if (parts.length !== 2) return false;
  
  const [ip, mask] = parts;
  const maskNum = parseInt(mask);
  
  // Validate mask range (0-32)
  if (isNaN(maskNum) || maskNum < 0 || maskNum > 32) return false;
  
  // Validate IPv4 address
  const octets = ip.split('.');
  if (octets.length !== 4) return false;
  
  return octets.every(octet => {
    const num = parseInt(octet);
    return !isNaN(num) && num >= 0 && num <= 255;
  });
}

function isIPv6WithMask(rule) {
  // Check if the string matches IPv6 CIDR notation (e.g., 2001:67c:4e8::/48)
  const parts = rule.split('/');
  if (parts.length !== 2) return false;

  const [ip, mask] = parts;
  const maskNum = parseInt(mask);

  // Validate mask range (0-128)
  if (isNaN(maskNum) || maskNum < 0 || maskNum > 128) return false;

  // Handle empty segments (::)
  const normalizedIP = ip.replace('::', ':'.repeat(8 - ip.split(':').length + 1));

  // Split into segments and validate
  const segments = normalizedIP.split(':');
  if (segments.length !== 8) return false;

  return segments.every(segment => {
    // Each segment should be a valid hex number between 0 and ffff
    return /^[0-9A-Fa-f]{1,4}$/.test(segment);
  });
}
