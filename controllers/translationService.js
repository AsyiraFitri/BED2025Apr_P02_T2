const axios = require('axios');

const endpoints = [
  {
    url: 'https://libretranslate.de/translate',
    method: 'POST',
    transformRequest: (text, source, target) => ({
      q: text,
      source,
      target,
      format: 'text'
    })
  },
  {
    url: 'https://translation-api.sample.com/translate',
    method: 'GET',
    transformRequest: (text, source, target) => ({
      params: { text, source, target }
    })
  }
];

const dictionary = {
  'hello': '你好',
  'thank you': '谢谢',
  'goodbye': '再见'
};

async function translateText(text) {
  // Auto-detect language
  const isChinese = /[\u4e00-\u9fa5]/.test(text);
  const sourceLang = isChinese ? 'zh' : 'en';
  const targetLang = isChinese ? 'en' : 'zh';

  // Try each API endpoint
  for (const endpoint of endpoints) {
    try {
      const config = {
        ...endpoint.transformRequest(text, sourceLang, targetLang),
        timeout: 5000
      };

      const response = await axios({
        method: endpoint.method,
        url: endpoint.url,
        ...config
      });

      if (response.data?.translatedText) {
        return {
          translatedText: response.data.translatedText,
          sourceLanguage: sourceLang,
          targetLanguage: targetLang
        };
      }
    } catch (err) {
      console.warn(`Endpoint ${endpoint.url} failed:`, err.message);
      continue;
    }
  }

  // Fallback to dictionary
  return {
    translatedText: dictionary[text.toLowerCase()] || text,
    sourceLanguage: sourceLang,
    targetLanguage: targetLang
  };
}

module.exports = { translateText };