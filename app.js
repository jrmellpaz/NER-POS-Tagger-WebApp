document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const inputText = document.getElementById('inputText');
    const analyzeBtn = document.getElementById('analyzeBtn');
    const sampleBtn = document.getElementById('sampleBtn');
    const clearBtn = document.getElementById('clearBtn');
    const processingSection = document.getElementById('processingSection');
    const progressBar = document.getElementById('progressBar');
    const progressText = document.getElementById('progressText');
    const statusText = document.getElementById('statusText');
    const entitiesCount = document.getElementById('entitiesCount');
    const relationsCount = document.getElementById('relationsCount');
    const processingTime = document.getElementById('processingTime');
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    const entityTypeFilter = document.getElementById('entityTypeFilter');
    
    // Tab switching functionality
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabId = button.getAttribute('data-tab');
            
            // Remove active class from all buttons and contents
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            // Add active class to clicked button and corresponding content
            button.classList.add('active');
            document.getElementById(tabId).classList.add('active');
        });
    });
    
    // Load sample text
    sampleBtn.addEventListener('click', function() {
        fetch('https://baconipsum.com/api/?type=meat-and-filler&paras=2&format=text')
            .then(response => response.text())
            .then(text => {
                inputText.value = text;
            })
            .catch(error => {
                console.error('Error loading sample text:', error);
                // Fallback sample text
                inputText.value = `Apple Inc. announced on Monday that Tim Cook, the CEO, will visit their new headquarters in Cupertino next month. The company reported $90 billion in revenue for the last quarter, exceeding analysts' expectations. Meanwhile, Microsoft's Satya Nadella commented on the recent partnership between the two tech giants during an interview in New York.`;
            });
    });
    
    // Clear text
    clearBtn.addEventListener('click', function() {
        inputText.value = '';
    });
    
    // Entity type filter
    entityTypeFilter.addEventListener('change', function() {
        filterEntities(this.value);
    });
    
    // Main analysis function
    analyzeBtn.addEventListener('click', async function() {
        const text = inputText.value.trim();
        if (!text) {
            alert('Please enter some text to analyze.');
            return;
        }
        
        // Show processing section
        processingSection.classList.remove('hidden');
        statusText.textContent = 'Processing...';
        statusText.classList.add('processing');
        
        // Reset counts
        entitiesCount.textContent = '0';
        relationsCount.textContent = '0';
        
        // Start timer
        const startTime = performance.now();
        
        try {
            // Update progress
            updateProgress(10, 'Loading NLP models...');
            
            // Load NLP models (based on JS lightweight Compromise NLP library)
            const nlp = window.nlp;
            if (!nlp) {
                throw new Error('NLP library not loaded');
            }

            // Extend nlp with the dates plugin if available
            if (window.compromiseDates) {
                nlp.extend(window.compromiseDates);
            }

            // Process text
            updateProgress(30, 'Analyzing text...');
            const doc = nlp(text);
            
            // Extract entities
            updateProgress(50, 'Extracting named entities...');
            const entities = extractEntities(doc, text);
            displayEntities(entities);
            entitiesCount.textContent = entities.length;
            
            // Extract relations
            updateProgress(70, 'Extracting relations...');
            const relations = extractRelations(doc, text);
            displayRelations(relations);
            relationsCount.textContent = relations.length;
            
            // Extract events
            updateProgress(80, 'Extracting events...');
            const events = extractEvents(doc, text);
            displayEvents(events);
            
            // Extract temporal expressions
            updateProgress(90, 'Extracting temporal expressions...');
            const temporalExpressions = extractTemporalExpressions(text);
            displayTemporalExpressions(temporalExpressions);
            
            // POS tagging
            updateProgress(95, 'Performing POS tagging...');
            const posTags = extractPOSTags(doc, text);
            displayPOSTags(posTags);
            
            // Complete
            updateProgress(100, 'Analysis complete!');
            statusText.textContent = 'Completed successfully';
            statusText.classList.remove('processing');
            
            // Calculate processing time
            const endTime = performance.now();
            const timeTaken = endTime - startTime;
            processingTime.textContent = `${Math.round(timeTaken)}ms`;
            
        } catch (error) {
            console.error('Error during analysis:', error);
            progressText.textContent = 'Error occurred during analysis';
            statusText.textContent = 'Failed';
            statusText.classList.remove('processing');
            statusText.style.color = 'var(--error-color)';
        }
    });
    
    // Helper function to update progress
    function updateProgress(percent, message) {
        progressBar.style.width = `${percent}%`;
        progressText.textContent = message;
    }
    
    // Entity extraction
    function extractEntities(doc, originalText) {
        const entities = [];
        
        // People
        const people = doc.people();
        people.forEach(person => {
            entities.push({
                text: person.text(),
                type: 'person',
                context: getContext(originalText, person.text())
            });
        });
        
        // Organizations
        const organizations = doc.organizations();
        organizations.forEach(org => {
            entities.push({
                text: org.text(),
                type: 'organization',
                context: getContext(originalText, org.text())
            });
        });
        
        // Places
        const places = doc.places();
        places.forEach(place => {
            entities.push({
                text: place.text(),
                type: 'place',
                context: getContext(originalText, place.text())
            });
        });
        
        // Dates
        const dates = doc.dates();
        dates.forEach(date => {
            entities.push({
                text: date.text(),
                type: 'date',
                context: getContext(originalText, date.text())
            });
        });
        
        // Values (numbers with units)
        const values = doc.values();
        values.forEach(value => {
            entities.push({
                text: value.text(),
                type: 'value',
                context: getContext(originalText, value.text())
            });
        });
        
        return entities;
    }
    
    // Relation extraction (simplified)
    function extractRelations(doc, originalText) {
        const relations = [];
        const sentences = doc.sentences();
        
        // Simple relation extraction based on patterns
        sentences.forEach(sentence => {
            const text = sentence.text();
            
            // Person-Organization relations (employment)
            const people = sentence.people();
            const orgs = sentence.organizations();
            
            if (people.length > 0 && orgs.length > 0) {
                people.forEach(person => {
                    orgs.forEach(org => {
                        relations.push({
                            entity1: person.text(),
                            entity2: org.text(),
                            type: 'employment',
                            relation: 'works for',
                            context: getContext(originalText, `${person.text()} ${org.text()}`)
                        });
                    });
                });
            }
            
            // Organization-Place relations (location)
            if (orgs.length > 0) {
                const places = sentence.places();
                orgs.forEach(org => {
                    places.forEach(place => {
                        relations.push({
                            entity1: org.text(),
                            entity2: place.text(),
                            type: 'location',
                            relation: 'located in',
                            context: getContext(originalText, `${org.text()} ${place.text()}`)
                        });
                    });
                });
            }
            
            // Person-Person relations (family or professional)
            if (people.length > 1) {
                for (let i = 0; i < people.length - 1; i++) {
                    for (let j = i + 1; j < people.length; j++) {
                        relations.push({
                            entity1: people[i].text(),
                            entity2: people[j].text(),
                            type: 'association',
                            relation: 'associated with',
                            context: getContext(originalText, `${people[i].text()} ${people[j].text()}`)
                        });
                    }
                }
            }
        });
        
        return relations;
    }
    
    // Event extraction (simplified)
    function extractEvents(doc, originalText) {
        const events = [];
        const sentences = doc.sentences();

        // Simple event extraction based on verbs
        sentences.forEach(sentence => {
            const verbs = sentence.verbs();
            verbs.forEach(verb => {
                const verbText = verb.text();

                // Determine event type based on trigger word
                let eventType = 'action';
                if (verbText.match(/said|announced|reported|stated/)) {
                    eventType = 'statement';
                } else if (verbText.match(/created|built|developed/)) {
                    eventType = 'creation';
                } else if (verbText.match(/increased|decreased|changed/)) {
                    eventType = 'change';
                }

                // Since compromise doesn't support .subjects() or .objects(),
                // we skip these or fill them with empty arrays
                events.push({
                    trigger: verbText,
                    type: eventType,
                    subjects: [], // No subject parsing in Compromise
                    objects: [],
                    context: getContext(originalText, verbText)
                });
            });
        });

        return events;
    }

    // Temporal expression extraction
    function extractTemporalExpressions(text) {
        const temporalExpressions = [];

        // Ensure Compromise-Dates plugin is registered
        if (typeof window.compromiseDates !== 'undefined') {
            nlp.extend(window.compromiseDates);
        } else {
            console.warn("Compromise-dates plugin not loaded");
            return temporalExpressions;
        }

        // Compromise.js Date Extraction
        const doc = nlp(text);
        const parsedDates = doc.dates().json(); // Use json() for structured output

        parsedDates.forEach(entry => {
            temporalExpressions.push({
                text: entry.text,
                type: "parsed_date",
                start: entry.start || "unknown",
                end: entry.end || "unknown",
                context: getContext(text, entry.text)
            });
        });

        const datePatterns = [
            // ISO dates (YYYY-MM-DD)
            { pattern: /\b\d{4}-\d{2}-\d{2}\b/g, type: 'date' },
            
            // Month Day, Year (May 15, 2023)
            { pattern: /\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]* \d{1,2},? \d{4}\b/g, type: 'month' },
            
            // Day Month Year (15 May 2023)
            { pattern: /\b\d{1,2} (?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]* \d{4}\b/g, type: 'month' },
            
            // Relative Dates (today, tomorrow, next week, etc.)
            { pattern: /\b(?:today|tomorrow|yesterday|next week|last week|this week|next month|last month|this month|next year|last year|this year)\b/gi, type: 'relative_date' },
            
            // Days of the Week (Monday, Tuesday, etc.)
            { pattern: /\b(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)\b/gi, type: 'day_of_week' },
            
            // Shortened Days of the Week (Mon, Tue, etc.)
            { pattern: /\b(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun)\b/gi, type: 'day_of_week' },
            
            // Time formats (HH:MM AM/PM, HH:MM:SS)
            { pattern: /\b\d{1,2}:\d{2}(?::\d{2})?\s?(?:AM|PM)?\b/gi, type: 'time' },
            
            // Year only (e.g., "in 2025")
            { pattern: /\b\d{4}\b/g, type: 'year' },
            
            // Decades (e.g., "the 1990s")
            { pattern: /\b\d{4}s\b/g, type: 'decade' },
            
            // Time phrases (morning, afternoon, evening, night)
            { pattern: /\b(?:morning|afternoon|evening|night|midnight|noon)\b/gi, type: 'time_of_day' }
        ];

        datePatterns.forEach(patternInfo => {
            const matches = text.match(patternInfo.pattern) || [];
            matches.forEach(match => {
                temporalExpressions.push({
                    text: match,
                    type: patternInfo.type,
                    context: getContext(text, match)
                });
            });
        });

        return temporalExpressions;
    }

    // Manual POS tagging due to unavailability of a full NLP library via CDN
    function extractPOSTags(text) {
        const posTags = [];
        
        // Ensure valid input
        if (!text || typeof text !== 'string' || text.trim() === "") {
            console.warn("Invalid or empty text input");
            return posTags;
        }

        // Tokenize text manually
        const words = text.match(/\b\w+\b/g) || []; // Extract words safely

        // Expanded regex-based tagging rules
        const regexPatterns = [
            { pattern: /^\d+$/, tag: 'CD' }, // Numbers
            { pattern: /.*ing$/, tag: 'VBG' }, // Gerunds (e.g., "running")
            { pattern: /.*ment$/, tag: 'NN' }, // Nouns (e.g., "development")
            { pattern: /.*ful$/, tag: 'JJ' }, // Adjectives (e.g., "beautiful")
            { pattern: /.*ly$/, tag: 'RB' }, // Adverbs (e.g., "quickly")
            { pattern: /^(the|a|an)$/i, tag: 'DT' }, // Determiners
            { pattern: /^(and|or|but)$/i, tag: 'CC' }, // Conjunctions
            { pattern: /^(he|she|it|they|we|you|I)$/i, tag: 'PRP' }, // Pronouns
            { pattern: /^(in|on|at|by|with|about)$/i, tag: 'IN' }, // Prepositions
            { pattern: /^(run|jump|eat|say|talk|write|build|create|report)$/i, tag: 'VB' }, // Common Verbs
            { pattern: /^(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)$/i, tag: 'DAY' }, // Days of the week
            { pattern: /\b\d{4}-\d{2}-\d{2}\b/, tag: 'DATE' }, // ISO date format
            { pattern: /\b(?:morning|afternoon|evening|night|midnight|noon)\b/i, tag: 'TIME' } // Time phrases
        ];

        // Apply regex-based POS tagging
        words.forEach(word => {
            let posTag = 'unknown';

            regexPatterns.forEach(patternInfo => {
                if (word.match(patternInfo.pattern)) {
                    posTag = patternInfo.tag;
                }
            });

            posTags.push({
                text: word,
                tag: posTag,
                context: getContext(text, word)
            });
        });

        return posTags;
    }

    // Extract POS tags manually (Penn Treebank inspired) since CDN not available
    function extractPOSTags(doc, originalText) {
        const posTags = [];

        // Define an ordered list of regex patterns with corresponding POS tags.
        // These patterns are inspired by Penn Treebank tag types.
        const regexPatterns = [
            // Punctuation (numbers come later)
            { pattern: /^[.,!?;:]+$/, tag: 'PUNCT' },
            
            // Numbers (integers or decimals)
            { pattern: /^\d+(\.\d+)?$/, tag: 'CD' },
            
            // Determiners & Articles
            { pattern: /\b(?:the|a|an|this|that|these|those)\b/i, tag: 'DT' },
            
            // Pronouns (personal)
            { pattern: /\b(?:I|me|you|he|she|it|we|they|him|her|us|them)\b/i, tag: 'PRP' },
            
            // Possessive pronouns
            { pattern: /\b(?:my|your|his|her|its|our|their)\b/i, tag: 'PRP$' },
            
            // Interjections
            { pattern: /\b(?:oh|ah|wow|oops|ouch|yay|hmm|ugh|huh|whoa)\b/i, tag: 'UH' },
            
            // Modal verbs
            { pattern: /\b(?:can|could|shall|should|will|would|may|might|must)\b/i, tag: 'MD' },
            
            // Prepositions (and other short function words)
            { pattern: /\b(?:in|on|at|by|with|about|against|between|through|during|before|after|above|below|under|over|into|out|onto|off)\b/i, tag: 'IN' },
            
            // Coordinating Conjunctions
            { pattern: /\b(?:and|or|but|nor|yet|so|for)\b/i, tag: 'CC' },
            
            // Wh-words (interrogative and relative pronouns)
            { pattern: /\b(?:who|whom|whose|which|what|where|when|why|how)\b/i, tag: 'WP' },
            
            // Possessive endings (e.g., "John's")
            { pattern: /.*'s$/, tag: 'POS' },
            
            // Adverbs (commonly ending in "ly")
            { pattern: /\b\w+ly\b/i, tag: 'RB' },
            
            // Gerunds, assuming they are verbs (ending in "ing")
            { pattern: /\b\w+ing\b/i, tag: 'VBG' },
            
            // Past tense verbs (ending in "ed")
            { pattern: /\b\w+ed\b/i, tag: 'VBD' },
            
            // Past participles (a rough check for "en")
            { pattern: /\b\w+en\b/i, tag: 'VBN' },
            
            // 3rd person singular verbs (ending in "s" – note: can overlap with nouns)
            { pattern: /\b\w+s\b/i, tag: 'VBZ' },
            
            // Adjectives (words with common adjective endings)
            { pattern: /\b\w+(able|ible|al|ful|ic|ive|less|ous)\b/i, tag: 'JJ' },
            
            // Comparative adjectives (ending in "er" — crude heuristic)
            { pattern: /\b\w+er\b/i, tag: 'JJR' },
            
            // Superlative adjectives (ending in "est")
            { pattern: /\b\w+est\b/i, tag: 'JJS' },
            
            // Proper Nouns (a capitalized word; note that this rule is simplistic)
            { pattern: /^[A-Z][a-z]+$/, tag: 'NNP' },
            
            // If none of the above match and token is alphabetic and may be 'Inc., Ltd. Corp., etc.', treat it as a common Noun.
            { pattern: /^[A-Za-z]+(?:\.[A-Za-z]+)*\.?$/, tag: 'NN' }
        ];
        
        // Extract terms from your Compromise document.
        const terms = doc.terms().json();
        if (!Array.isArray(terms) || terms.length === 0) {
            console.warn("Terms not extracted properly:", terms);
            return posTags;
        }
        
        // Process each term.
        terms.forEach(term => {
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
            text: token,
            tag: posTag,
            context: getContext(originalText, token)
            });
        });
        
        return posTags;
        }

    // Get context around a match
    function getContext(fullText, matchText, contextLength = 30) {
        const index = fullText.indexOf(matchText);
        if (index === -1) return matchText;
        
        const start = Math.max(0, index - contextLength);
        const end = Math.min(fullText.length, index + matchText.length + contextLength);
        let context = fullText.substring(start, end);
        
        if (start > 0) {
            context = '...' + context;
        }
        if (end < fullText.length) {
            context = context + '...';
        }
        
        return context;
    }
    
    // Display functions
    function displayEntities(entities) {
        const container = document.getElementById('entitiesResults');
        container.innerHTML = '';
        
        entities.forEach(entity => {
            const entityCard = document.createElement('div');
            entityCard.className = 'entity-card';
            
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
        const container = document.getElementById('relationsResults');
        container.innerHTML = '';
        
        relations.forEach(relation => {
            const relationCard = document.createElement('div');
            relationCard.className = 'relation-card';
            
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
        const container = document.getElementById('eventsResults');
        container.innerHTML = '';
        
        events.forEach(event => {
            const eventCard = document.createElement('div');
            eventCard.className = 'event-card';
            
            const subjects = event.subjects.length > 0 ? 
                `Subjects: ${event.subjects.join(', ')}` : '';
            const objects = event.objects.length > 0 ? 
                `Objects: ${event.objects.join(', ')}` : '';
            
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
        const container = document.getElementById('temporalResults');
        container.innerHTML = '';
        
        temporals.forEach(temp => {
            const tempCard = document.createElement('div');
            tempCard.className = 'temporal-card';
            
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
        const container = document.getElementById('posResults');
        container.innerHTML = '';
        
        tags.forEach(tag => {
            const posCard = document.createElement('div');
            posCard.className = 'pos-card';
            
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
        const entities = document.querySelectorAll('.entity-card');
        
        entities.forEach(entity => {
            if (type === 'all') {
                entity.style.display = 'block';
            } else {
                const entityType = entity.querySelector('.entity-type').classList.contains(type);
                entity.style.display = entityType ? 'block' : 'none';
            }
        });
    }
    
    // Initialize with a simple text if needed
    if (inputText.value === '') {
        inputText.value = `Apple Inc. announced on Monday that Tim Cook, the CEO, will visit their new headquarters in Cupertino next month. The company reported $90 billion in revenue for the last quarter, exceeding analysts' expectations. Meanwhile, Microsoft's Satya Nadella commented on the recent partnership between the two tech giants during an interview in New York.`;
    }
});