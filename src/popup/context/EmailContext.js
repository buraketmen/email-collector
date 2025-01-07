import React, { createContext, useContext, useState, useEffect } from "react";

const EmailContext = createContext();

export const EmailProvider = ({ children }) => {
  const [emails, setEmails] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [filteredEmails, setFilteredEmails] = useState([]);
  const [loaders, setLoaders] = useState({
    reScan: false,
    copy: false,
  });
  const [processes, setProcesses] = useState({
    reScanIsFailed: false,
  });

  useEffect(() => {
    chrome.storage.sync.get({ collectedEmails: [] }, (result) => {
      setEmails(result.collectedEmails);
    });

    function storageChanged(changes, namespace) {
      if (changes?.collectedEmails) {
        setEmails(changes.collectedEmails.newValue);
      }
    }

    chrome.storage.onChanged.addListener(storageChanged);

    return () => {
      chrome.storage.onChanged.removeListener(storageChanged);
    };
  }, []);

  const getFilteredEmails = (text) => {
    if (text === "") return emails;
    return emails.filter((element) =>
      element.toLowerCase().includes(text.toLowerCase())
    );
  };

  useEffect(() => {
    setFilteredEmails(getFilteredEmails(searchText));
  }, [emails, searchText]);

  const clearEmails = () => {
    chrome.storage.sync.set({ collectedEmails: [] });
  };

  const reScanEmails = async () => {
    try {
      setLoaders((prev) => ({ ...prev, reScan: true }));
      setProcesses((prev) => ({ ...prev, reScanIsFailed: false }));
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });
      const response = await chrome.tabs.sendMessage(tab.id, {
        type: "reScanTab",
      });
      setLoaders((prev) => ({ ...prev, reScan: false }));
      setProcesses((prev) => ({
        ...prev,
        reScanIsFailed: response?.status === false || response?.status === null,
      }));
    } catch (error) {
      setLoaders((prev) => ({ ...prev, reScan: false }));
      setProcesses((prev) => ({ ...prev, reScanIsFailed: true }));
    }
  };

  const copyEmails = () => {
    setLoaders((prev) => ({ ...prev, copy: true }));
    chrome.storage.sync.get({ collectedEmails: [] }, (result) => {
      navigator.clipboard
        .writeText(result.collectedEmails.join("\n"))
        .then(() => {
          setLoaders((prev) => ({ ...prev, copy: false }));
        });
    });
  };

  const value = {
    emails,
    filteredEmails,
    loaders,
    processes,
    searchText,
    setSearchText,
    clearEmails,
    isEmailEmpty: emails.length === 0,
    reScanEmails,
    copyEmails,
  };

  return (
    <EmailContext.Provider value={value}>{children}</EmailContext.Provider>
  );
};

export const useEmail = () => {
  const context = useContext(EmailContext);
  if (context === undefined) {
    throw new Error("useEmail must be used within an EmailProvider");
  }
  return context;
};
