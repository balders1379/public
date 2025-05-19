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
          "chatgpt.com"
      ],
      "Telegram" : [
          "149.154.175.50/8",
          "91.108.56.102/8"
      ],
      "Google" : [
          "google.com",
          "google.com.hk",
          "youtube.com",
          "googlevideo.com",
          "ytimg.com",
          "ggpht.com",
          "withgoogle.com",
          "gmail.com",
          "gstatic.com",
          "google-analytics.com",
          "clarity.ms"
      ],
  };
  
  rules_other = [
    "MATCH, ✈️Final"
  ];
  
  // 自动获取所有节点名
  allProxies = [];
  
  // 如果配置中有 proxies 字段（静态节点）
  if (Array.isArray(config.proxies)) {
    //allProxies.push("Deflult");
    for (const proxy of config.proxies) {
      if (proxy.name) allProxies.push(proxy.name);
    }
  }
  
  // 如果是 proxy-providers 模式（更常见）
  if (config["proxy-providers"]) {
    for (const provider of Object.values(config["proxy-providers"])) {
      if (provider.proxies && Array.isArray(provider.proxies)) {
        for (const proxy of provider.proxies) {
          if (proxy.name) allProxies.push(proxy.name);
        }
      }
    }
  }
  
  config["rules"] = [];
  config["proxy-groups"] = [{
    name: "Default",
    type: "select",
    proxies: allProxies
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
    config["proxy-groups"].push({
        name: rule_name,
        type: "select",
        proxies: ["Default", ...allProxies]
    });
  }
  
  config["proxy-groups"].push({
    name: "✈️Final",
    type: "select",
    proxies: ["Default", ...allProxies]
  });
  config["rules"] = config["rules"].concat(rules_other);
  
  return config;
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
