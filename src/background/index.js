chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.set({ isAutoscanning: false });
});

const TAB_LOAD_TIMEOUT = 10000; // 10 seconds for each tab
const BATCH_SIZE = 10;
// RFC 5322 Official Standard Email Regex with word boundary checks
const EMAIL_REGEX = new RegExp(
  [
    "\\b",
    "(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*",
    '|"(?:[\\x01-\\x08\\x0b\\x0c\\x0e-\\x1f\\x21\\x23-\\x5b\\x5d-\\x7f]',
    '|\\\\[\\x01-\\x09\\x0b\\x0c\\x0e-\\x7f])*")@',
    "(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?",
    "|\\[(?:(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9]))\\.){3}",
    "(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9]))])",
    "\\b",
  ].join(""),
  "gi"
);
function isValidEmail(email) {
  if (!email || email.length > 254) return false;

  const invalidPatterns = [
    /\d+in(?=\w+@)/i,
    /\d+[a-z]+(?=@)/i,
    /[^a-z0-9.!#$%&'*+/=?^_`{|}~-](?=\w+@)/i,
  ];

  if (invalidPatterns.some((pattern) => pattern.test(email))) {
    return false;
  }

  const [localPart, domain] = email.split("@");
  if (!localPart || !domain) return false;

  if (localPart.length > 64) return false;
  if (localPart.startsWith(".") || localPart.endsWith(".")) return false;
  if (localPart.includes("..")) return false;

  const validLocalPartRegex = /^[a-zA-Z0-9!#$%&'*+/=?^_`{|}~.-]+$/;
  if (!validLocalPartRegex.test(localPart)) return false;

  if (domain.length > 255) return false;
  if (domain.startsWith("-") || domain.endsWith("-")) return false;
  if (!/^[a-zA-Z0-9.-]+$/.test(domain)) return false;
  if (!domain.includes(".")) return false;

  const tld = domain.split(".").pop();
  if (!tld || tld.length < 2 || !/^[a-zA-Z]+$/.test(tld)) return false;

  return true;
}
const IMAGE_EXTENSIONS = new Set([
  ".png",
  ".jpg",
  ".jpeg",
  ".bmp",
  ".gif",
  ".svg",
  ".webp",
  ".tiff",
  ".ico",
  ".heic",
  ".heif",
  ".avif",
]);
const VIDEO_EXTENSIONS = new Set([
  ".mp4",
  ".mov",
  ".avi",
  ".mkv",
  ".wmv",
  ".flv",
  ".webm",
  ".mpg",
  ".mpeg",
  ".m4v",
  ".3gp",
  ".3g2",
  ".m2ts",
  ".mts",
  ".m2v",
  ".m4a",
  ".m4v",
  ".mp3",
  ".aac",
  ".ogg",
  ".oga",
  ".wav",
  ".webm",
  ".flac",
  ".ape",
  ".mka",
  ".mkv",
  ".mp3",
  ".aac",
  ".ogg",
  ".oga",
  ".wav",
  ".webm",
  ".flac",
  ".ape",
  ".mka",
  ".mkv",
  ".mp3",
  ".aac",
  ".ogg",
  ".oga",
  ".wav",
  ".webm",
  ".flac",
  ".ape",
  ".mka",
]);
const AUDIO_EXTENSIONS = new Set([
  ".mp3",
  ".aac",
  ".ogg",
  ".oga",
  ".wav",
  ".webm",
  ".flac",
  ".ape",
  ".mka",
]);
const DOCUMENT_EXTENSIONS = new Set([
  ".doc",
  ".docx",
  ".xls",
  ".xlsx",
  ".ppt",
  ".pptx",
  ".pdf",
  ".txt",
  ".csv",
  ".rtf",
  ".odt",
  ".ods",
  ".odp",
  ".html",
  ".htm",
  ".xml",
  ".json",
  ".md",
  ".markdown",
  ".tex",
  ".latex",
  ".djvu",
  ".epub",
  ".mobi",
  ".azw",
  ".azw3",
  ".azw4",
  ".azw5",
  ".azw6",
  ".azw7",
  ".azw8",
  ".azw9",
  ".azw10",
  ".azw11",
  ".azw12",
  ".azw13",
  ".azw14",
  ".azw15",
  ".azw16",
  ".azw17",
  ".azw18",
  ".azw19",
  ".azw20",
]);
const ARCHIVE_EXTENSIONS = new Set([
  ".zip",
  ".rar",
  ".7z",
  ".tar",
  ".gz",
  ".bz2",
  ".xz",
  ".lz",
  ".lzma",
  ".lzo",
  ".lz4",
  ".zstd",
  ".lzop",
  ".lzma2",
  ".lzma3",
  ".lzma4",
  ".lzma5",
  ".lzma6",
  ".lzma7",
  ".lzma8",
  ".lzma9",
  ".lzma10",
  ".lzma11",
  ".lzma12",
  ".lzma13",
  ".lzma14",
  ".lzma15",
  ".lzma16",
  ".lzma17",
  ".lzma18",
  ".lzma19",
  ".lzma20",
]);

function isAttachment(email) {
  return [
    ...IMAGE_EXTENSIONS,
    ...VIDEO_EXTENSIONS,
    ...AUDIO_EXTENSIONS,
    ...DOCUMENT_EXTENSIONS,
    ...ARCHIVE_EXTENSIONS,
  ].some((ext) => email.endsWith(ext));
}

function extractEmails(content) {
  if (!content) return [];

  const matches = content.match(EMAIL_REGEX);
  if (!matches) return [];

  const cleanedMatches = matches.map((match) => {
    return match.replace(/^[^a-zA-Z0-9]+|[^a-zA-Z0-9]+$/g, "");
  });

  return [...new Set(cleanedMatches)]
    .filter((email) => {
      const normalizedEmail = email.toLowerCase();
      return !isAttachment(normalizedEmail) && isValidEmail(normalizedEmail);
    })
    .map((email) => email.toLowerCase());
}

async function updateEmails(content) {
  try {
    const emails = extractEmails(content);
    if (!emails.length) return;

    const { collectedEmails = [] } = await chrome.storage.sync.get(
      "collectedEmails"
    );

    const uniqueEmails = [...new Set([...collectedEmails, ...emails])].sort();

    await chrome.storage.sync.set({ collectedEmails: uniqueEmails });
  } catch (error) {
    console.error("Email update error:", error);
  }
}

function createTab(url) {
  return new Promise((resolve, reject) => {
    try {
      chrome.tabs.create({ url, active: false }, (tab) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve(tab);
        }
      });
    } catch (error) {
      reject(error);
    }
  });
}

const getData = async (key, defaultValue) => {
  const value = await new Promise((resolve) => {
    chrome.storage.sync.get({ [key]: defaultValue }, (result) => {
      resolve(result[key]);
    });
  });
  return value;
};

async function scanWebsites(websites, isAutoscanningSequential) {
  const tabIds = new Set();
  try {
    await chrome.storage.sync.set({ isAutoscanning: true });
    const validWebsites = websites.filter((url) => url && url.trim());

    if (isAutoscanningSequential) {
      for (const site of validWebsites) {
        const isStillAutoscanning = await getData("isAutoscanning", true);
        if (!isStillAutoscanning) break;

        try {
          const tab = await createTab(site);
          await waitForTabLoad(tab.id, TAB_LOAD_TIMEOUT);
          await ensureContentScriptInjected(tab.id);
          await chrome.tabs.remove(tab.id);
        } catch (error) {
          console.error(`Error processing ${site}:`, error);
          continue;
        }
      }
    } else {
      const processTab = async (site) => {
        let tabId = null;
        try {
          const tab = await createTab(site);
          tabId = tab.id;
          tabIds.add(tabId);

          await waitForTabLoad(tabId, TAB_LOAD_TIMEOUT);
          await ensureContentScriptInjected(tabId);

          await chrome.tabs.remove(tabId);
          tabIds.delete(tabId);
        } catch (error) {
          console.error(`Error processing ${site}:`, error);
          if (tabId) {
            try {
              await chrome.tabs.remove(tabId);
              tabIds.delete(tabId);
            } catch (e) {
              console.error("Error closing tab:", e);
            }
          }
        }
      };

      for (let i = 0; i < validWebsites.length; i += BATCH_SIZE) {
        const batch = validWebsites.slice(i, i + BATCH_SIZE);
        await Promise.allSettled(batch.map(processTab));

        if (i + BATCH_SIZE < validWebsites.length) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }
    }

    await chrome.storage.sync.set({ isAutoscanning: false });
    return { status: true };
  } catch (error) {
    console.error("Scan websites error:", error);
    for (const tabId of tabIds) {
      try {
        await chrome.tabs.remove(tabId);
      } catch (e) {
        console.error("Error closing tab:", e);
      }
    }
    await chrome.storage.sync.set({ isAutoscanning: false });
    return { status: false };
  }
}

function waitForTabLoad(tabId, timeout) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error("Tab load timeout"));
    }, timeout);

    chrome.tabs.onUpdated.addListener(function listener(id, info) {
      if (id === tabId && info.status === "complete") {
        chrome.tabs.onUpdated.removeListener(listener);
        clearTimeout(timer);
        setTimeout(resolve, 2000);
      }
    });
  });
}

async function ensureContentScriptInjected(tabId) {
  try {
    if (!chrome.scripting?.executeScript) {
      return;
    }

    await chrome.scripting.executeScript({
      target: { tabId },
      function: () => {
        if (!window._emailCollectorInjected) {
          window._emailCollectorInjected = true;

          const observer = new MutationObserver((mutations) => {
            const newContent = document.body.textContent;
            if (newContent && newContent.length > 0) {
              chrome.runtime.sendMessage({
                action: "scanEmails",
                content: newContent,
              });
            }
          });

          observer.observe(document.body, {
            childList: true,
            subtree: true,
            characterData: true,
          });

          const initialContent = document.body.textContent;
          if (initialContent && initialContent.length > 0) {
            chrome.runtime.sendMessage({
              action: "scanEmails",
              content: initialContent,
            });
          }

          const originalXHR = window.XMLHttpRequest.prototype.open;
          window.XMLHttpRequest.prototype.open = function () {
            this.addEventListener("load", function () {
              const content = document.body.textContent;
              chrome.runtime.sendMessage({
                action: "scanEmails",
                content: content,
              });
            });
            return originalXHR.apply(this, arguments);
          };

          const originalFetch = window.fetch;
          window.fetch = function () {
            return originalFetch.apply(this, arguments).then((response) => {
              setTimeout(() => {
                const content = document.body.textContent;
                chrome.runtime.sendMessage({
                  action: "scanEmails",
                  content: content,
                });
              }, 1000);
              return response;
            });
          };
        }
      },
    });
  } catch (error) {
    console.error("Script injection error:", error);
  }
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  (async () => {
    try {
      switch (request.action) {
        case "scanEmails": {
          await updateEmails(request.content);
          sendResponse({ status: true });
          break;
        }
        case "scanWebsites": {
          const result = await scanWebsites(
            request.websites,
            request.isSequential
          );
          sendResponse(result);
          break;
        }
      }
    } catch (error) {
      console.error("Message handling error:", error);
      sendResponse({ status: false });
    }
  })();
  return true;
});
