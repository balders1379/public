// extend.js
function main(config) {
    rules_map = {
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
        ]
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
        let rule_array = rules_map[rule_name].map(rule => "DOMAIN-SUFFIX," + rule + "," + rule_name);
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
  