document.addEventListener("DOMContentLoaded", function () {
  // Security and performance state
  let isProcessing = false;
  let lastProcessTime = 0;
  const PROCESS_COOLDOWN = 5000; // 5 seconds cooldown

  // Check if required libraries are loaded
  if (typeof window.nlp === "undefined") {
    console.error("Compromise.js library not loaded!");
    alert(
      "Error: Required NLP library (Compromise.js) is not loaded. Please check your internet connection and refresh the page."
    );
    return;
  }

  // DOM Elements
  const inputText = document.getElementById("inputText");
  const analyzeBtn = document.getElementById("analyzeBtn");
  const sampleBtn = document.getElementById("sampleBtn");
  const clearBtn = document.getElementById("clearBtn");
  const fileInput = document.getElementById("fileInput");
  const uploadBtn = document.getElementById("uploadBtn");
  const fileName = document.getElementById("fileName");
  const processingSection = document.getElementById("processingSection");
  const progressBar = document.getElementById("progressBar");
  const progressText = document.getElementById("progressText");
  const statusText = document.getElementById("statusText");
  const entitiesCount = document.getElementById("entitiesCount");
  const relationsCount = document.getElementById("relationsCount");
  const processingTime = document.getElementById("processingTime");
  const tabButtons = document.querySelectorAll(".tab-btn");
  const tabContents = document.querySelectorAll(".tab-content");
  const entityTypeFilter = document.getElementById("entityTypeFilter");
  const loadingOverlay = document.getElementById("loadingOverlay");
  const loadingText = document.getElementById("loadingText");

  // Tab switching functionality
  tabButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const tabId = button.getAttribute("data-tab");

      // Remove active class from all buttons and contents
      tabButtons.forEach((btn) => btn.classList.remove("active"));
      tabContents.forEach((content) => content.classList.remove("active"));

      // Add active class to clicked button and corresponding content
      button.classList.add("active");
      document.getElementById(tabId).classList.add("active");
    });
  });

  async function fetchGeminiInfo(prompt) {
    // 1. Define the API Key (leave empty if provided by the environment)
    const apiKey = "AIzaSyDqIe68b0fDIpvYnWrnn9OTbLcLy1MbWMo"; // IMPORTANT: In many sandboxed/Canvas environments, leave this empty.

    // 2. Specify the model
    const model = "gemini-2.0-flash"; // Or another model like gemini-pro

    // 3. Construct the API URL
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    // 4. Prepare the request payload
    const payload = {
      contents: [
        {
          role: "user",
          parts: [
            {
              text: prompt,
            },
          ],
        },
      ],
      // You can add generationConfig here if needed, e.g., for temperature, maxOutputTokens
      // "generationConfig": {
      //   "temperature": 0.7,
      //   "maxOutputTokens": 1000
      // }
    };

    // 5. Configure the fetch request
    const requestOptions = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    };

    // 6. Make the API call and handle the response
    try {
      const response = await fetch(apiUrl, requestOptions);

      if (!response.ok) {
        // If the response is not OK, try to parse the error details
        const errorData = await response.json().catch(() => null); // Try to get JSON error, otherwise null
        console.error("API Error Response:", errorData);
        throw new Error(
          `API request failed with status ${response.status}: ${response.statusText}`
        );
      }

      const result = await response.json();

      // 7. Extract the generated text
      if (
        result.candidates &&
        result.candidates.length > 0 &&
        result.candidates[0].content &&
        result.candidates[0].content.parts &&
        result.candidates[0].content.parts.length > 0
      ) {
        const generatedText = result.candidates[0].content.parts[0].text;
        return generatedText;
      } else {
        console.warn("No content found in the API response:", result);
        // Check for safety ratings or other reasons for no content
        if (result.promptFeedback && result.promptFeedback.blockReason) {
          return `Content blocked due to: ${
            result.promptFeedback.blockReason
          }. Details: ${JSON.stringify(result.promptFeedback.safetyRatings)}`;
        }
        return "Sorry, I couldn't get a response. The response format was unexpected.";
      }
    } catch (error) {
      console.error("Error fetching from Gemini API:", error);
      return `An error occurred: ${error.message}`;
    }
  }

  // --- Example Usage ---
  // async function main() {
  //   const userPrompt = "Explain quantum computing in simple terms.";
  //   console.log(`Sending prompt: "${userPrompt}"`);

  //   const loadingIndicator = document.getElementById("loading"); // Assuming you have a <div id="loading"></div>
  //   const outputElement = document.getElementById("output"); // Assuming you have a <div id="output"></div>

  //   if (loadingIndicator) loadingIndicator.style.display = "block";
  //   if (outputElement) outputElement.textContent = "";

  //   const geminiResponse = await fetchGeminiInfo(userPrompt);

  //   if (loadingIndicator) loadingIndicator.style.display = "none";
  //   if (outputElement) outputElement.textContent = geminiResponse;

  //   console.log("\nGemini's Response:");
  //   console.log(geminiResponse);
  // }

  // To run this example, you would typically call main()
  // For example, in an HTML file, you could have:
  // <button onclick="main()">Get Info from Gemini</button>
  // <div id="loading" style="display:none;">Loading...</div>
  // <div id="output"></div>
  // main(); // Or call it on a button click, etc.

  // Load sample text
  sampleBtn.addEventListener("click", async function () {
    if (isProcessing) {
      showError("Please wait for current operation to complete");
      return;
    }

    showLoading("Generating creative text...");
    const userPrompt =
      "Give me a meaningful paragraph with around 200 words that can be used for NLP NER POST Tagging analysis.";

    let result;

    try {
      result = await fetchGeminiInfo(userPrompt);
    } catch (error) {
      console.error("Error fetching sample text:", error);
      showError("Failed to generate sample text. Please try again later.");
    } finally {
      inputText.value = DOMPurify.sanitize(result);
      hideLoading();
    }

    // fetch("https://api.openai.com/v1/completions", {
    //   method: "POST",
    //   headers: {
    //     "Content-Type": "application/json",
    //     Authorization: "Bearer 2db96450-ce52-49ad-afb2-c39647ab81f4",
    //   },
    //   body: JSON.stringify({
    //     model: "text-davinci-003",
    //     prompt:
    //       "Give me a meaningful paragraph with around 200 words that can be used for NLP NER POST Tagging analysis.",
    //     max_tokens: 100,
    //   }),
    // })
    //   .then((res) => res.json())
    //   .then((data) => {
    //     if (data.choices && data.choices[0] && data.choices[0].text) {
    //       inputText.value = DOMPurify.sanitize(data.choices[0].text);
    //     } else {
    //       showError(
    //         "Failed to generate sample text. Please check your API key or try again later."
    //       );
    //       inputText.value = DOMPurify.sanitize(
    //         "Leaves fall in golden whispers, crisp air bites, pumpkins glow. Autumn's quiet song."
    //       );
    //     }
    //     hideLoading();
    //   })
    //   .catch((error) => {
    //     console.error("DeepAI API error:", error);
    //     inputText.value = DOMPurify.sanitize(
    //       "Leaves fall in golden whispers, crisp air bites, pumpkins glow. Autumn's quiet song."
    //     );
    //     hideLoading();
    //   });
  });

  // Clear text
  clearBtn.addEventListener("click", function () {
    if (isProcessing) {
      showError("Please wait for current operation to complete");
      return;
    }
    inputText.value = "";
  });

  // Entity type filter
  entityTypeFilter.addEventListener("change", function () {
    filterEntities(this.value);
  });

  // Main analysis function
  analyzeBtn.addEventListener("click", async function () {
    const text = inputText.value.trim();
    if (!text) {
      alert("Please enter some text to analyze.");
      return;
    }

    // Show processing section
    processingSection.classList.remove("hidden");
    statusText.textContent = "Processing...";
    statusText.classList.add("processing");

    // Reset counts
    entitiesCount.textContent = "0";
    relationsCount.textContent = "0";

    // Start timer
    const startTime = performance.now();

    try {
      // Update progress
      updateProgress(10, "Loading NLP models...");

      // Load NLP models (based on JS lightweight Compromise NLP library)
      const nlp = window.nlp;
      if (!nlp) {
        throw new Error(
          "NLP library not loaded. Please check if compromise.js is properly included."
        );
      }

      // Extend nlp with the dates plugin if available
      if (window.compromiseDates) {
        nlp.extend(window.compromiseDates);
      }

      // Process text
      updateProgress(30, "Analyzing text...");
      const doc = nlp(text);

      // Extract entities
      updateProgress(50, "Extracting named entities...");
      const entities = extractEntities(doc, text);
      displayEntities(entities);
      entitiesCount.textContent = entities.length;

      // Extract relations
      updateProgress(70, "Extracting relations...");
      const relations = extractRelations(doc, text);
      displayRelations(relations);
      relationsCount.textContent = relations.length;

      // Update knowledge graph
      updateProgress(75, "Updating knowledge graph...");
      updateGraph(entities, relations);

      // Extract events
      updateProgress(80, "Extracting events...");
      const events = extractEvents(doc, text);
      displayEvents(events);

      // Extract temporal expressions
      updateProgress(90, "Extracting temporal expressions...");
      const temporalExpressions = extractTemporalExpressions(text);
      displayTemporalExpressions(temporalExpressions);

      // POS tagging
      updateProgress(95, "Performing POS tagging...");
      const posTags = extractPOSTags(doc, text);
      displayPOSTags(posTags);

      // Complete
      updateProgress(100, "Analysis complete!");
      statusText.textContent = "Completed successfully";
      statusText.classList.remove("processing");

      // Calculate processing time
      const endTime = performance.now();
      const timeTaken = endTime - startTime;
      processingTime.textContent = `${Math.round(timeTaken)}ms`;
    } catch (error) {
      console.error("Error during analysis:", error);
      console.error("Error stack:", error.stack);
      progressText.textContent = `Error: ${error.message}`;
      statusText.textContent = "Failed";
      statusText.classList.remove("processing");
      statusText.style.color = "var(--error-color)";

      // Show error details in an alert
      alert(
        `Analysis failed: ${error.message}\n\nPlease check the console for more details.`
      );
    }
  });

  // Helper function to update progress
  function updateProgress(percent, message) {
    progressBar.style.width = `${percent}%`;
    progressText.textContent = DOMPurify.sanitize(message);
  }

  // Show loading overlay
  function showLoading(message) {
    loadingText.textContent = DOMPurify.sanitize(message);
    loadingOverlay.classList.add("active");
    document.body.style.overflow = "hidden";
  }

  // Hide loading overlay
  function hideLoading() {
    loadingOverlay.classList.remove("active");
    document.body.style.overflow = "";
  }

  // Show error message
  function showError(message) {
    alert(DOMPurify.sanitize(message));
  }

  // File upload handling with validation
  uploadBtn.addEventListener("click", () => {
    if (isProcessing) {
      showError("Please wait for current operation to complete");
      return;
    }
    fileInput.click();
  });

  fileInput.addEventListener("change", async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // File validation
    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
    const validTypes = [
      "text/plain",
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    if (file.size > MAX_FILE_SIZE) {
      showError("File size exceeds 5MB limit");
      fileInput.value = "";
      return;
    }

    if (!validTypes.includes(file.type)) {
      showError("Invalid file type. Please upload a .txt, .docx, or .pdf file");
      fileInput.value = "";
      return;
    }

    fileName.textContent = DOMPurify.sanitize(file.name);
    processingSection.classList.remove("hidden");
    statusText.textContent = "Reading file...";
    statusText.classList.add("processing");
    showLoading("Reading uploaded file...");

    try {
      let text = "";
      const fileType = file.name.split(".").pop().toLowerCase();

      switch (fileType) {
        case "txt":
          text = await readTextFile(file);
          break;
        case "docx":
          text = await readDocxFile(file);
          break;
        case "pdf":
          text = await readPdfFile(file);
          break;
        default:
          throw new Error("Unsupported file type");
      }

      inputText.value = DOMPurify.sanitize(text);
      statusText.textContent = "File loaded successfully";
      statusText.classList.remove("processing");
      hideLoading();
    } catch (error) {
      console.error("Error reading file:", error);
      statusText.textContent = "Error reading file";
      statusText.classList.remove("processing");
      statusText.style.color = "var(--error-color)";
      hideLoading();
      showError("Error reading file: " + error.message);
      fileInput.value = "";
    }
  });

  // File reading functions
  async function readTextFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(DOMPurify.sanitize(e.target.result));
      reader.onerror = (e) => reject(new Error("Error reading text file"));
      reader.readAsText(file);
    });
  }

  async function readDocxFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const arrayBuffer = e.target.result;
          const result = await mammoth.extractRawText({ arrayBuffer });
          resolve(DOMPurify.sanitize(result.value));
        } catch (error) {
          reject(new Error("Error reading DOCX file: " + error.message));
        }
      };
      reader.onerror = () => reject(new Error("Error reading DOCX file"));
      reader.readAsArrayBuffer(file);
    });
  }

  async function readPdfFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const typedarray = new Uint8Array(e.target.result);
          const pdf = await pdfjsLib.getDocument(typedarray).promise;
          let fullText = "";

          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items
              .map((item) => item.str)
              .join(" ");
            fullText += DOMPurify.sanitize(pageText) + "\n";
          }

          resolve(fullText);
        } catch (error) {
          reject(new Error("Error reading PDF file: " + error.message));
        }
      };
      reader.onerror = () => reject(new Error("Error reading PDF file"));
      reader.readAsArrayBuffer(file);
    });
  }

  // Entity extraction
  function extractEntities(doc, originalText) {
    const entities = [];

    try {
      // People
      const people = doc.people();
      if (people && people.length > 0) {
        people.forEach((person) => {
          if (person && typeof person.text === "function") {
            entities.push({
              text: DOMPurify.sanitize(person.text()),
              type: "person",
              context: getContext(originalText, person.text()),
            });
          }
        });
      }

      // Organizations
      const organizations = doc.organizations();
      if (organizations && organizations.length > 0) {
        organizations.forEach((org) => {
          if (org && typeof org.text === "function") {
            entities.push({
              text: DOMPurify.sanitize(org.text()),
              type: "organization",
              context: getContext(originalText, org.text()),
            });
          }
        });
      }

      // Places
      const places = doc.places();
      if (places && places.length > 0) {
        places.forEach((place) => {
          if (place && typeof place.text === "function") {
            entities.push({
              text: DOMPurify.sanitize(place.text()),
              type: "place",
              context: getContext(originalText, place.text()),
            });
          }
        });
      }

      // Dates
      const dates = doc.dates();
      if (dates && dates.length > 0) {
        dates.forEach((date) => {
          if (date && typeof date.text === "function") {
            entities.push({
              text: DOMPurify.sanitize(date.text()),
              type: "date",
              context: getContext(originalText, date.text()),
            });
          }
        });
      }

      // Values (numbers with units)
      const values = doc.values();
      if (values && values.length > 0) {
        values.forEach((value) => {
          if (value && typeof value.text === "function") {
            entities.push({
              text: DOMPurify.sanitize(value.text()),
              type: "value",
              context: getContext(originalText, value.text()),
            });
          }
        });
      }
    } catch (error) {
      console.error("Error in extractEntities:", error);
      throw new Error("Failed to extract entities: " + error.message);
    }

    return entities;
  }

  // Relation extraction (simplified)
  function extractRelations(doc, originalText) {
    const relations = [];

    try {
      const sentences = doc.sentences();
      if (!sentences || !sentences.length) {
        return relations;
      }

      // Simple relation extraction based on patterns
      sentences.forEach((sentence) => {
        if (!sentence || typeof sentence.text !== "function") return;

        const text = sentence.text();

        // Person-Organization relations (employment)
        const people = sentence.people();
        const orgs = sentence.organizations();

        if (people && people.length > 0 && orgs && orgs.length > 0) {
          people.forEach((person) => {
            if (!person || typeof person.text !== "function") return;
            orgs.forEach((org) => {
              if (!org || typeof org.text !== "function") return;
              relations.push({
                entity1: DOMPurify.sanitize(person.text()),
                entity2: DOMPurify.sanitize(org.text()),
                type: "employment",
                relation: "works for",
                context: getContext(
                  originalText,
                  `${person.text()} ${org.text()}`
                ),
              });
            });
          });
        }

        // Organization-Place relations (location)
        if (orgs && orgs.length > 0) {
          const places = sentence.places();
          if (places && places.length > 0) {
            orgs.forEach((org) => {
              if (!org || typeof org.text !== "function") return;
              places.forEach((place) => {
                if (!place || typeof place.text !== "function") return;
                relations.push({
                  entity1: DOMPurify.sanitize(org.text()),
                  entity2: DOMPurify.sanitize(place.text()),
                  type: "location",
                  relation: "located in",
                  context: getContext(
                    originalText,
                    `${org.text()} ${place.text()}`
                  ),
                });
              });
            });
          }
        }

        // Person-Person relations (family or professional)
        if (people && people.length > 1) {
          for (let i = 0; i < people.length - 1; i++) {
            if (!people[i] || typeof people[i].text !== "function") continue;
            for (let j = i + 1; j < people.length; j++) {
              if (!people[j] || typeof people[j].text !== "function") continue;
              relations.push({
                entity1: DOMPurify.sanitize(people[i].text()),
                entity2: DOMPurify.sanitize(people[j].text()),
                type: "association",
                relation: "associated with",
                context: getContext(
                  originalText,
                  `${people[i].text()} ${people[j].text()}`
                ),
              });
            }
          }
        }
      });
    } catch (error) {
      console.error("Error in extractRelations:", error);
      throw new Error("Failed to extract relations: " + error.message);
    }

    return relations;
  }

  // Event extraction (simplified)
  function extractEvents(doc, originalText) {
    const events = [];

    try {
      const sentences = doc.sentences();
      if (!sentences || !sentences.length) {
        return events;
      }

      // Simple event extraction based on verbs
      sentences.forEach((sentence) => {
        if (!sentence || typeof sentence.verbs !== "function") return;

        const verbs = sentence.verbs();
        if (!verbs || !verbs.length) return;

        verbs.forEach((verb) => {
          if (!verb || typeof verb.text !== "function") return;

          const verbText = verb.text();

          // Determine event type based on trigger word
          let eventType = "action";
          if (verbText.match(/said|announced|reported|stated/)) {
            eventType = "statement";
          } else if (verbText.match(/created|built|developed/)) {
            eventType = "creation";
          } else if (verbText.match(/increased|decreased|changed/)) {
            eventType = "change";
          }

          events.push({
            trigger: DOMPurify.sanitize(verbText),
            type: eventType,
            subjects: [], // No subject parsing in Compromise
            objects: [],
            context: getContext(originalText, verbText),
          });
        });
      });
    } catch (error) {
      console.error("Error in extractEvents:", error);
      throw new Error("Failed to extract events: " + error.message);
    }

    return events;
  }

  // Temporal expression extraction
  function extractTemporalExpressions(text) {
    const temporalExpressions = [];

    // Ensure Compromise-Dates plugin is registered
    if (typeof window.compromiseDates !== "undefined") {
      nlp.extend(window.compromiseDates);
    } else {
      console.warn("Compromise-dates plugin not loaded");
      return temporalExpressions;
    }

    // Compromise.js Date Extraction
    const doc = nlp(text);
    const parsedDates = doc.dates().json(); // Use json() for structured output

    parsedDates.forEach((entry) => {
      temporalExpressions.push({
        text: DOMPurify.sanitize(entry.text),
        type: "parsed_date",
        start: entry.start || "unknown",
        end: entry.end || "unknown",
        context: getContext(text, entry.text),
      });
    });

    const datePatterns = [
      // ISO dates (YYYY-MM-DD)
      { pattern: /\b\d{4}-\d{2}-\d{2}\b/g, type: "date" },

      // Month Day, Year (May 15, 2023)
      {
        pattern:
          /\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]* \d{1,2},? \d{4}\b/g,
        type: "month",
      },

      // Day Month Year (15 May 2023)
      {
        pattern:
          /\b\d{1,2} (?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]* \d{4}\b/g,
        type: "month",
      },

      // Relative Dates (today, tomorrow, next week, etc.)
      {
        pattern:
          /\b(?:today|tomorrow|yesterday|next week|last week|this week|next month|last month|this month|next year|last year|this year)\b/gi,
        type: "relative_date",
      },

      // Days of the Week (Monday, Tuesday, etc.)
      {
        pattern:
          /\b(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)\b/gi,
        type: "day_of_week",
      },

      // Shortened Days of the Week (Mon, Tue, etc.)
      { pattern: /\b(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun)\b/gi, type: "day_of_week" },

      // Time formats (HH:MM AM/PM, HH:MM:SS)
      { pattern: /\b\d{1,2}:\d{2}(?::\d{2})?\s?(?:AM|PM)?\b/gi, type: "time" },

      // Year only (e.g., "in 2025")
      { pattern: /\b\d{4}\b/g, type: "year" },

      // Decades (e.g., "the 1990s")
      { pattern: /\b\d{4}s\b/g, type: "decade" },

      // Time phrases (morning, afternoon, evening, night)
      {
        pattern: /\b(?:morning|afternoon|evening|night|midnight|noon)\b/gi,
        type: "time_of_day",
      },
    ];

    datePatterns.forEach((patternInfo) => {
      const matches = text.match(patternInfo.pattern) || [];
      matches.forEach((match) => {
        temporalExpressions.push({
          text: DOMPurify.sanitize(match),
          type: patternInfo.type,
          context: getContext(text, match),
        });
      });
    });

    return temporalExpressions;
  }

  // Extract POS tags manually (Penn Treebank inspired) since CDN not available
  function extractPOSTags(doc, originalText) {
    const posTags = [];

    // Define an ordered list of regex patterns with corresponding POS tags.
    // These patterns are inspired by Penn Treebank tag types.
    const regexPatterns = [
      // Punctuation (numbers come later)
      { pattern: /^[.,!?;:]+$/, tag: "PUNCT" },

      // Numbers (integers or decimals)
      { pattern: /^\d+(\.\d+)?$/, tag: "CD" },

      // Determiners & Articles
      { pattern: /\b(?:the|a|an|this|that|these|those)\b/i, tag: "DT" },

      // Pronouns (personal)
      {
        pattern: /\b(?:I|me|you|he|she|it|we|they|him|her|us|them)\b/i,
        tag: "PRP",
      },

      // Possessive pronouns
      { pattern: /\b(?:my|your|his|her|its|our|their)\b/i, tag: "PRP$" },

      // Interjections
      {
        pattern: /\b(?:oh|ah|wow|oops|ouch|yay|hmm|ugh|huh|whoa)\b/i,
        tag: "UH",
      },

      // Modal verbs
      {
        pattern: /\b(?:can|could|shall|should|will|would|may|might|must)\b/i,
        tag: "MD",
      },

      // Prepositions (and other short function words)
      {
        pattern:
          /\b(?:in|on|at|by|with|about|against|between|through|during|before|after|above|below|under|over|into|out|onto|off)\b/i,
        tag: "IN",
      },

      // Coordinating Conjunctions
      { pattern: /\b(?:and|or|but|nor|yet|so|for)\b/i, tag: "CC" },

      // Wh-words (interrogative and relative pronouns)
      {
        pattern: /\b(?:who|whom|whose|which|what|where|when|why|how)\b/i,
        tag: "WP",
      },

      // Possessive endings (e.g., "John's")
      { pattern: /.*'s$/, tag: "POS" },

      // Adverbs (commonly ending in "ly")
      { pattern: /\b\w+ly\b/i, tag: "RB" },

      // Gerunds, assuming they are verbs (ending in "ing")
      { pattern: /\b\w+ing\b/i, tag: "VBG" },

      // Past tense verbs (ending in "ed")
      { pattern: /\b\w+ed\b/i, tag: "VBD" },

      // Past participles (a rough check for "en")
      { pattern: /\b\w+en\b/i, tag: "VBN" },

      // 3rd person singular verbs (ending in "s" – note: can overlap with nouns)
      { pattern: /\b\w+s\b/i, tag: "VBZ" },

      // Adjectives (words with common adjective endings)
      { pattern: /\b\w+(able|ible|al|ful|ic|ive|less|ous)\b/i, tag: "JJ" },

      // Comparative adjectives (ending in "er" — crude heuristic)
      { pattern: /\b\w+er\b/i, tag: "JJR" },

      // Superlative adjectives (ending in "est")
      { pattern: /\b\w+est\b/i, tag: "JJS" },

      // Proper Nouns (a capitalized word; note that this rule is simplistic)
      { pattern: /^[A-Z][a-z]+$/, tag: "NNP" },

      // If none of the above match and token is alphabetic and may be 'Inc., Ltd. Corp., etc.', treat it as a common Noun.
      { pattern: /^[A-Za-z]+(?:\.[A-Za-z]+)*\.?$/, tag: "NN" },
    ];

    // Extract terms from your Compromise document.
    const terms = doc.terms().json();
    if (!Array.isArray(terms) || terms.length === 0) {
      console.warn("Terms not extracted properly:", terms);
      return posTags;
    }

    // Process each term.
    terms.forEach((term) => {
      const token = term.text;
      let posTag = "unknown";

      // Loop through the patterns in order; assign the tag from the first match.
      for (let i = 0; i < regexPatterns.length; i++) {
        if (regexPatterns[i].pattern.test(token)) {
          posTag = regexPatterns[i].tag;
          break; // break out once a match is found
        }
      }

      // Add the result to the output array. (Assumes getContext() is defined elsewhere.)
      posTags.push({
        text: DOMPurify.sanitize(token),
        tag: posTag,
        context: getContext(originalText, token),
      });
    });

    return posTags;
  }

  // Get context around a match
  function getContext(fullText, matchText, contextLength = 30) {
    const index = fullText.indexOf(matchText);
    if (index === -1) return matchText;

    const start = Math.max(0, index - contextLength);
    const end = Math.min(
      fullText.length,
      index + matchText.length + contextLength
    );
    let context = fullText.substring(start, end);

    if (start > 0) {
      context = "..." + context;
    }
    if (end < fullText.length) {
      context = context + "...";
    }

    return DOMPurify.sanitize(context);
  }

  // Display functions
  function displayEntities(entities) {
    const container = document.getElementById("entitiesResults");
    container.innerHTML = "";

    entities.forEach((entity) => {
      const entityCard = document.createElement("div");
      entityCard.className = "entity-card";

      entityCard.innerHTML = `
                <div class="entity-header">
                    <span class="entity-text">${entity.text}</span>
                    <span class="entity-type ${entity.type}">${entity.type}</span>
                </div>
                <div class="entity-context">${entity.context}</div>
                <div class="entity-meta">
                    <span>Length: ${entity.text.length} chars</span>
                </div>
            `;

      container.appendChild(entityCard);
    });
  }

  function displayRelations(relations) {
    const container = document.getElementById("relationsResults");
    container.innerHTML = "";

    relations.forEach((relation) => {
      const relationCard = document.createElement("div");
      relationCard.className = "relation-card";

      relationCard.innerHTML = `
                <div class="relation-header">
                    <span class="relation-text">${relation.entity1} <strong>${relation.relation}</strong> ${relation.entity2}</span>
                    <span class="relation-type">${relation.type}</span>
                </div>
                <div class="relation-context">${relation.context}</div>
                <div class="relation-meta">
                    <span>Relation type: ${relation.type}</span>
                </div>
            `;

      container.appendChild(relationCard);
    });
  }

  function displayEvents(events) {
    const container = document.getElementById("eventsResults");
    container.innerHTML = "";

    events.forEach((event) => {
      const eventCard = document.createElement("div");
      eventCard.className = "event-card";

      const subjects =
        event.subjects.length > 0
          ? `Subjects: ${event.subjects.join(", ")}`
          : "";
      const objects =
        event.objects.length > 0 ? `Objects: ${event.objects.join(", ")}` : "";

      eventCard.innerHTML = `
                <div class="event-header">
                    <span class="event-text">${event.trigger}</span>
                    <span class="event-type">${event.type}</span>
                </div>
                <div class="event-context">${event.context}</div>
                <div class="event-meta">
                    <span>${subjects}</span>
                    <span>${objects}</span>
                </div>
            `;

      container.appendChild(eventCard);
    });
  }

  function displayTemporalExpressions(temporals) {
    const container = document.getElementById("temporalResults");
    container.innerHTML = "";

    temporals.forEach((temp) => {
      const tempCard = document.createElement("div");
      tempCard.className = "temporal-card";

      tempCard.innerHTML = `
                <div class="temporal-header">
                    <span class="temporal-text">${temp.text}</span>
                    <span class="temporal-type">${temp.type}</span>
                </div>
                <div class="temporal-context">${temp.context}</div>
                <div class="temporal-meta">
                    <span>Type: ${temp.type}</span>
                </div>
            `;

      container.appendChild(tempCard);
    });
  }

  function displayPOSTags(tags) {
    const container = document.getElementById("posResults");
    container.innerHTML = "";

    tags.forEach((tag) => {
      const posCard = document.createElement("div");
      posCard.className = "pos-card";

      posCard.innerHTML = `
                <div class="pos-header">
                    <span class="pos-text">${tag.text}</span>
                    <span class="pos-type">${tag.tag}</span>
                </div>
                <div class="pos-context">${tag.context}</div>
                <div class="pos-meta">
                    <span>POS tag: <span class="pos-tag">${tag.tag}</span></span>
                </div>
            `;

      container.appendChild(posCard);
    });
  }

  // Filter entities by type
  function filterEntities(type) {
    const entities = document.querySelectorAll(".entity-card");

    entities.forEach((entity) => {
      if (type === "all") {
        entity.style.display = "block";
      } else {
        const entityType = entity
          .querySelector(".entity-type")
          .classList.contains(type);
        entity.style.display = entityType ? "block" : "none";
      }
    });
  }

  // Initialize with a simple text if needed
  if (inputText.value === "") {
    inputText.value = DOMPurify.sanitize(
      `Apple Inc. announced on Monday that Tim Cook, the CEO, will visit their new headquarters in Cupertino next month. The company reported $90 billion in revenue for the last quarter, exceeding analysts' expectations. Meanwhile, Microsoft's Satya Nadella commented on the recent partnership between the two tech giants during an interview in New York.`
    );
  }

  // Knowledge Graph Visualization
  let graphData = {
    nodes: [],
    links: [],
  };

  let simulation = null;
  let svg = null;
  let tooltip = null;

  function initializeGraph() {
    // Create SVG container
    svg = d3
      .select("#graphVisualization")
      .append("svg")
      .attr("width", "100%")
      .attr("height", "100%")
      .call(
        d3
          .zoom()
          .scaleExtent([0.1, 4])
          .on("zoom", (event) => {
            svg.select("g").attr("transform", event.transform);
          })
      );

    // Add main group for zooming
    svg.append("g");

    // Create tooltip
    tooltip = d3
      .select("body")
      .append("div")
      .attr("class", "tooltip")
      .style("opacity", 0);

    // Add zoom controls
    document.getElementById("zoomIn").addEventListener("click", () => {
      svg.transition().duration(750).call(d3.zoom().scaleBy, 1.3);
    });

    document.getElementById("zoomOut").addEventListener("click", () => {
      svg.transition().duration(750).call(d3.zoom().scaleBy, 0.7);
    });

    document.getElementById("resetZoom").addEventListener("click", () => {
      svg.transition().duration(750).call(d3.zoom().transform, d3.zoomIdentity);
    });
  }

  function updateGraph(entities, relations) {
    // Clear existing graph
    if (svg) {
      svg.selectAll("*").remove();
      svg.append("g");
    } else {
      initializeGraph();
    }

    // Prepare nodes from entities
    const nodes = entities.map((entity) => ({
      id: entity.text,
      type: entity.type,
      context: entity.context,
    }));

    // Prepare links from relations
    const links = relations.map((relation) => ({
      source: relation.entity1,
      target: relation.entity2,
      type: relation.type,
      relation: relation.relation,
    }));

    // Update graph data
    graphData = { nodes, links };

    // Create force simulation
    simulation = d3
      .forceSimulation(nodes)
      .force(
        "link",
        d3
          .forceLink(links)
          .id((d) => d.id)
          .distance(100)
      )
      .force("charge", d3.forceManyBody().strength(-300))
      .force(
        "center",
        d3.forceCenter(
          document.getElementById("graphVisualization").clientWidth / 2,
          document.getElementById("graphVisualization").clientHeight / 2
        )
      );

    // Create links
    const link = svg
      .select("g")
      .selectAll(".link")
      .data(links)
      .enter()
      .append("line")
      .attr("class", (d) => `link link-${d.type}`)
      .attr("marker-end", "url(#arrow)");

    // Create nodes
    const node = svg
      .select("g")
      .selectAll(".node")
      .data(nodes)
      .enter()
      .append("g")
      .attr("class", (d) => `node node-${d.type}`)
      .call(
        d3
          .drag()
          .on("start", dragstarted)
          .on("drag", dragged)
          .on("end", dragended)
      );

    // Add circles to nodes
    node.append("circle").attr("r", 8);

    // Add labels to nodes
    node
      .append("text")
      .text((d) => d.id)
      .attr("x", 12)
      .attr("y", 4);

    // Add tooltips
    node
      .on("mouseover", function (event, d) {
        tooltip.transition().duration(200).style("opacity", 0.9);
        tooltip
          .html(
            `
                <strong>${DOMPurify.sanitize(d.id)}</strong><br/>
                Type: ${DOMPurify.sanitize(d.type)}<br/>
                Context: ${DOMPurify.sanitize(d.context)}
            `
          )
          .style("left", event.pageX + 10 + "px")
          .style("top", event.pageY - 28 + "px");
      })
      .on("mouseout", function () {
        tooltip.transition().duration(500).style("opacity", 0);
      });

    // Update positions on simulation tick
    simulation.on("tick", () => {
      link
        .attr("x1", (d) => d.source.x)
        .attr("y1", (d) => d.source.y)
        .attr("x2", (d) => d.target.x)
        .attr("y2", (d) => d.target.y);

      node.attr("transform", (d) => `translate(${d.x},${d.y})`);
    });
  }

  // Drag functions
  function dragstarted(event, d) {
    if (!event.active) simulation.alphaTarget(0.3).restart();
    d.fx = d.x;
    d.fy = d.y;
  }

  function dragged(event, d) {
    d.fx = event.x;
    d.fy = event.y;
  }

  function dragended(event, d) {
    if (!event.active) simulation.alphaTarget(0);
    d.fx = null;
    d.fy = null;
  }

  // Initialize graph when the page loads
  initializeGraph();

  // Report Generation and Download
  const downloadReport = document.getElementById("downloadReport");
  const reportFormat = document.getElementById("reportFormat");

  downloadReport.addEventListener("click", () => {
    if (isProcessing) {
      showError("Please wait for current operation to complete");
      return;
    }

    const format = reportFormat.value;
    const report = generateReport(format);
    downloadFile(report, format);
  });

  function generateReport(format) {
    const report = {
      timestamp: new Date().toISOString(),
      inputText: inputText.value,
      entities: graphData.nodes,
      relations: graphData.links,
      processingTime: processingTime.textContent,
      statistics: {
        entityCount: entitiesCount.textContent,
        relationCount: relationsCount.textContent,
      },
    };

    switch (format) {
      case "json":
        return JSON.stringify(report, null, 2);

      case "csv":
        return generateCSV(report);

      case "txt":
        return generateTextReport(report);

      case "pdf":
        return generatePDF(report);

      default:
        return JSON.stringify(report, null, 2);
    }
  }

  function generateCSV(report) {
    const lines = [];

    // Add metadata
    lines.push("Analysis Report");
    lines.push(`Generated: ${report.timestamp}`);
    lines.push(`Processing Time: ${report.processingTime}`);
    lines.push(`Entity Count: ${report.statistics.entityCount}`);
    lines.push(`Relation Count: ${report.statistics.relationCount}`);
    lines.push("");

    // Add entities
    lines.push("Entities");
    lines.push("Text,Type,Context");
    report.entities.forEach((entity) => {
      lines.push(
        `${entity.id},${entity.type},"${entity.context.replace(/"/g, '""')}"`
      );
    });
    lines.push("");

    // Add relations
    lines.push("Relations");
    lines.push("Source,Target,Type,Relation");
    report.relations.forEach((relation) => {
      lines.push(
        `${relation.source},${relation.target},${relation.type},${relation.relation}`
      );
    });

    return lines.join("\n");
  }

  function generateTextReport(report) {
    const lines = [];

    // Add header
    lines.push("=== Text Analysis Report ===");
    lines.push(`Generated: ${report.timestamp}`);
    lines.push(`Processing Time: ${report.processingTime}`);
    lines.push("");

    // Add statistics
    lines.push("=== Statistics ===");
    lines.push(`Total Entities: ${report.statistics.entityCount}`);
    lines.push(`Total Relations: ${report.statistics.relationCount}`);
    lines.push("");

    // Add entities
    lines.push("=== Entities ===");
    report.entities.forEach((entity) => {
      lines.push(`- ${entity.id} (${entity.type})`);
      lines.push(`  Context: ${entity.context}`);
      lines.push("");
    });

    // Add relations
    lines.push("=== Relations ===");
    report.relations.forEach((relation) => {
      lines.push(
        `- ${relation.source} ${relation.relation} ${relation.target}`
      );
      lines.push(`  Type: ${relation.type}`);
      lines.push("");
    });

    return lines.join("\n");
  }

  function generatePDF(report) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // Set font styles
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.setTextColor(0, 0, 0);

    // Add title
    doc.text("Text Analysis Report", 105, 30, { align: "center" });

    // Add timestamp and statistics
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text(`Generated: ${report.timestamp}`, 20, 45);
    doc.text(`Processing Time: ${report.processingTime}`, 20, 55);
    doc.text(`Total Entities: ${report.statistics.entityCount}`, 20, 65);
    doc.text(`Total Relations: ${report.statistics.relationCount}`, 20, 75);

    // Add entities table
    doc.setFont("helvetica", "bold");
    doc.text("Entities", 20, 90);

    const entityData = report.entities.map((entity) => [
      entity.id,
      entity.type,
      entity.context,
    ]);

    doc.autoTable({
      startY: 95,
      head: [["Entity", "Type", "Context"]],
      body: entityData,
      theme: "grid",
      headStyles: { fillColor: [74, 111, 165] },
      styles: { fontSize: 10, cellPadding: 5 },
      columnStyles: {
        0: { cellWidth: 50 },
        1: { cellWidth: 30 },
        2: { cellWidth: "auto" },
      },
    });

    // Add relations table
    const relationsY = doc.lastAutoTable.finalY + 20;
    doc.setFont("helvetica", "bold");
    doc.text("Relations", 20, relationsY);

    const relationData = report.relations.map((relation) => [
      relation.source,
      relation.target,
      relation.type,
      relation.relation,
    ]);

    doc.autoTable({
      startY: relationsY + 5,
      head: [["Source", "Target", "Type", "Relation"]],
      body: relationData,
      theme: "grid",
      headStyles: { fillColor: [74, 111, 165] },
      styles: { fontSize: 10, cellPadding: 5 },
      columnStyles: {
        0: { cellWidth: 40 },
        1: { cellWidth: 40 },
        2: { cellWidth: 30 },
        3: { cellWidth: "auto" },
      },
    });

    // Add original text with page breaks
    const textY = doc.lastAutoTable.finalY + 20;
    doc.setFont("helvetica", "bold");
    doc.text("Original Text", 20, textY);

    doc.setFont("helvetica", "normal");
    const splitText = doc.splitTextToSize(report.inputText, 170);
    let currentY = textY + 10;
    const pageHeight = doc.internal.pageSize.height;
    const margin = 20;

    // Function to add footer to each page
    const addFooter = () => {
      const footerY = pageHeight - margin;
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(
        "Advanced Text Analysis Toolkit © 2025 | Using the lightweight Compromise.js NLP library",
        105,
        footerY,
        { align: "center" }
      );
    };

    // Add footer to first page
    addFooter();

    // Add text with page breaks
    for (let i = 0; i < splitText.length; i++) {
      if (currentY > pageHeight - margin - 10) {
        doc.addPage();
        currentY = margin;
        addFooter();
      }
      doc.text(splitText[i], 20, currentY);
      currentY += 7;
    }

    return doc;
  }

  function downloadFile(content, format) {
    if (format === "pdf") {
      content.save(
        `text-analysis-report-${new Date().toISOString().slice(0, 10)}.pdf`
      );
      return;
    }

    const blob = new Blob([content], { type: getMimeType(format) });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `text-analysis-report-${new Date()
      .toISOString()
      .slice(0, 10)}.${format}`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }

  function getMimeType(format) {
    switch (format) {
      case "json":
        return "application/json";
      case "csv":
        return "text/csv";
      case "txt":
        return "text/plain";
      case "pdf":
        return "application/pdf";
      default:
        return "text/plain";
    }
  }
});
