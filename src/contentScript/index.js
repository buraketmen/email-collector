const OBSERVER_TIMEOUT = 10000; // 10 seconds maximum wait time

const getText = () => {
  try {
    const textContent = [];

    textContent.push(document.body.textContent || "");

    const metaTags = Array.from(document.getElementsByTagName("meta"))
      .map((meta) => meta.content)
      .join(" ");
    textContent.push(metaTags);

    const linkTags = Array.from(document.getElementsByTagName("a"))
      .map((link) => link.href)
      .join(" ");
    textContent.push(linkTags);

    const ariaLabels = Array.from(document.querySelectorAll("[aria-label]"))
      .map((el) => el.getAttribute("aria-label"))
      .join(" ");
    textContent.push(ariaLabels);

    const titles = Array.from(document.querySelectorAll("[title]"))
      .map((el) => el.getAttribute("title"))
      .join(" ");
    textContent.push(titles);

    const dataAttrs = Array.from(document.querySelectorAll("*"))
      .map((el) => {
        return Array.from(el.attributes)
          .filter((attr) => attr.name.startsWith("data-"))
          .map((attr) => attr.value);
      })
      .flat()
      .join(" ");
    textContent.push(dataAttrs);

    const inputValues = Array.from(
      document.querySelectorAll('input[type="email"], input[type="text"]')
    )
      .map((input) => input.value)
      .join(" ");
    textContent.push(inputValues);

    const altTexts = Array.from(document.querySelectorAll("[alt]"))
      .map((el) => el.getAttribute("alt"))
      .join(" ");
    textContent.push(altTexts);

    return textContent.join(" ");
  } catch (error) {
    console.error("getText error:", error);
    return "";
  }
};

// Convert storage operations to Promise
const getStorageData = (key, defaultValue) => {
  return new Promise((resolve) => {
    chrome.storage.sync.get({ [key]: defaultValue }, (result) => {
      resolve(result[key]);
    });
  });
};

// Convert message sending to Promise
const sendMessageToBackground = (message) => {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage(message, (response) => {
      resolve(response);
    });
  });
};

// Main function to run when page loads
const scanPageContent = async () => {
  try {
    const isAppActive = await getStorageData("isAppActive", true);
    if (!isAppActive) return;

    let scanTimeout;
    let observer;

    const performScan = async () => {
      const pageContent = getText();
      await sendMessageToBackground({
        action: "scanEmails",
        content: pageContent,
      });
    };

    return new Promise((resolve) => {
      // Create a timeout to ensure we don't wait forever
      scanTimeout = setTimeout(() => {
        if (observer) {
          observer.disconnect();
        }
        performScan();
        resolve();
      }, OBSERVER_TIMEOUT);

      // Create an observer instance
      observer = new MutationObserver(
        debounce(async () => {
          const readyState = document.readyState;
          if (readyState === "complete") {
            observer.disconnect();
            clearTimeout(scanTimeout);
            await performScan();
            resolve();
          }
        }, 1500)
      );

      // Start observing
      observer.observe(document.documentElement, {
        childList: true,
        subtree: true,
      });

      if (document.readyState === "complete") {
        observer.disconnect();
        clearTimeout(scanTimeout);
        performScan();
        resolve();
      }
    });
  } catch (error) {
    console.error("scanPageContent error:", error);
  }
};

// Utility function to debounce the observer callback
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Clean message handler
const handleMessage = async (message) => {
  try {
    switch (message.type) {
      case "reScanTab": {
        const pageContent = getText();
        const response = await sendMessageToBackground({
          action: "scanEmails",
          content: pageContent,
        });
        return { status: response?.status ?? false };
      }
      default:
        return { status: false };
    }
  } catch (error) {
    console.error("handleMessage error:", error);
    return { status: false };
  }
};

// Event listeners
window.addEventListener("load", scanPageContent);

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  handleMessage(message).then(sendResponse);
  return true;
});
