let setAgentDetailsCopy = () => { }
try {
    const setAgentDetailsApiUrl = 'https://intdev-api.starhealth.in/event/tracking/send/user/details'
    const callKafkaProducerApiUrl = 'https://intdev-api.starhealth.in/event/tracking/send/event/details'

        ; (() => {
            /**
             * Namespace to track user behavior.
             */
            window.trackUser = {}

            /**
             * Counter for generating unique local storage keys.
             */
            let storageCounter = 0

            /**
             * Default settings for user tracking.
             */
            let defaultSettings = {
                noOfClicks: true,
                clickDetails: true,
                geolocation: true,
                userDetails: true
            }

            // For processing actions
            defaultSettings.actionItem = {
                processOnAction: true,
                selector: '',
                event: ''
            }

            defaultSettings.processData = endResult => { }

            const getSessionId = () => {
                return sessionStorage.getItem('sessionId')
            }

            const getDeviceType = () => {
                const userAgent = navigator.userAgent.toLowerCase()

                if (/mobile|android|iphone|ipad|ipod|blackberry|opera mini|iemobile/i.test(userAgent)) {
                    return 'MOBILE'
                } else {
                    return 'WEB'
                }
            }

            /**
             * Object to store end result data.
             * @type {Object}
             */
            let endResult = {
                eventData: {
                    browserInfo: {
                        appCodeName: navigator.appCodeName || '',
                        appName: navigator.appName || '',
                        platform: navigator.platform || '',
                        userAgent: navigator.userAgent || '',
                        deviceType: getDeviceType()
                    },
                    time: {
                        totalTime: 0,
                        timeOnPage: 0
                    },
                    clicks: {
                        currentClickCount: 0,
                        clickDetails: {}
                    },
                    geoLocation: {
                        latitude: 0.0,
                        longitude: 0.0
                    }
                }
            }

            /**
             * Flag to check browser support.
             * @type {boolean}
             */
            let support = !!document.querySelector && !!document.addEventListener

            /**
             * User settings.
             * @type {Object}
             */
            let settings

            /**
             * Merges default settings with user-provided options
             *
             * @param {Object} initials - Default settings.
             * @param {Object} options - User-provided options.
             * @returns {Object} - Merged object containing the merged settings.
             */
            const mergeSettings = (initials, options) => {
                let option
                for (option in options) {
                    if (options.hasOwnProperty(option)) {
                        initials[option] = options[option]
                    }
                }
                return initials
            }

            // Helper Functions
            let helperActions = {
                /**
                 * Capture the user's geolocation coordinates using the geoLocation API.
                 * @private
                 */
                captureGeoLocation: () => {
                    if ('geolocation' in navigator) {
                        navigator.geolocation.getCurrentPosition(
                            position => {
                                // Add latitude and longitude to the geoLocation
                                endResult.eventData.geoLocation.latitude = position.coords.latitude
                                endResult.eventData.geoLocation.longitude = position.coords.longitude
                            },
                            error => {
                                // Handle and log any errors related to geolocation retrieval
                                console.error('Error getting geolocation:', error)
                            }
                        )
                    } else {
                        console.log('GeoLocation is not supported in this browser.')
                    }
                }
            }

            // start the operations
            /**
             * Start the event listeners and tracking.
             * @param {Object} options - User options.
             */
            const start = options => {
                if (!support) {
                    console.log('Plugin is not supported with this Application.')
                    return
                }

                // Merge user settings with defaults
                if (options && typeof options === 'object') {
                    settings = mergeSettings(defaultSettings, options)
                }

                document.addEventListener('DOMContentLoaded', () => {
                    // Start the scheduler
                    scheduler() //.scheduleTask()

                    // if (!sessionStorage.getItem('sessionId')) {
                    // setAgentDetails('BA0000190454', 'Aveden Oltrax', 'akshay.patil@starhealth.in', 'GPR0881', 'GrowPro')
                    //   // should be called by UI at Session start or session refreshed
                    // } else {
                    //   console.log('Session ID already exists in sessionStorage.')
                    // }

                    // Countdown Timer
                    window.setInterval(() => {
                        if (document['visibilityState'] === 'visible') {
                            endResult.eventData.time.timeOnPage++
                        }
                        endResult.eventData.time.totalTime++
                    }, 1000)

                    document.addEventListener('mouseup', event => {
                        if (settings.noOfClicks) {
                            endResult.eventData.clicks.currentClickCount++
                        }

                        if (settings.clickDetails) {
                            const clickedElement = event.target
                            const elementName = clickedElement.nodeName
                            const elementId = clickedElement.id || ''
                            const elementClass = clickedElement.className || ''
                            let elementText = clickedElement.textContent || ''
                            const altText = event.target instanceof HTMLImageElement ? event.target.alt : ''
                            const toolTipText = clickedElement.title || ''
                            const ariaLabelText = clickedElement.getAttribute('aria-label') || ''
                            const pageTitle = document.title || ''
                            const pagePath = window.location.pathname || ''

                            endResult.eventData.clicks.clickDetails = {
                                timestamp: Date.now(),
                                sessionId: getSessionId(),
                                node: elementName,
                                class: elementClass,
                                id: elementId,
                                text: elementText,
                                altText: altText,
                                toolTipText: toolTipText,
                                ariaLabelText: ariaLabelText,
                                pageTitle: pageTitle,
                                pagePath: pagePath
                            }
                        }

                        processEndResults()
                    })

                    if (settings.geolocation) {
                        helperActions.captureGeoLocation()
                    }

                    // Event Listener to process
                    if (settings.actionItem.processOnAction) {
                        let node = document.querySelector(settings.actionItem.selector)
                        if (!!!node) throw new Error('Selector was not found.')
                        node.addEventListener(settings.actionItem.event, () => {
                            return processEndResults()
                        })
                    }
                })
            }

            /**
             * End Result Generation
             * Process end result data and perform actions.
             */
            const processEndResults = () => {
                if (settings.hasOwnProperty('processData')) {
                    let details = endResult.eventData.clicks

                    if (!(details.text || details.altText || details.ariaLabelText || details.toolTipText)) {
                        console.log(JSON.stringify(endResult))
                        let localStorageKey = 'trackingData_' + storageCounter++
                        localStorage.setItem(localStorageKey, JSON.stringify(endResult))
                        // endResult.eventData.clicks.clickDetails = {}
                        return settings.processData.call(undefined, endResult)
                    }
                }
                return false
            }

            // attaching stuffs on namespace
            // only expose necessary methds
            trackUser.start = start
            trackUser.processEndResults = processEndResults

            // exporting namespace via window
            window.trackUser = trackUser
        })()

    trackUser.start({
        processData: results => { },
        actionItem: {
            processOnAction: false
            //   selector: '#range-slider',
            //   event: 'click'
        }
    })

    /**
     * Generates and retrieves a unique session ID using UUID v4.
     * @returns {string} - Unique session ID.
     */
    const setSessionId = () => {
        let sessionId = crypto.randomUUID()
        sessionStorage.setItem('sessionId', sessionId)
        return sessionId
    }

    /**
     * Sets agent details and sends them to a specified API endpoint.
     */
    const setAgentDetails = (agentId, agentName, agentEmail, channelId, channelName) => {
        let sessionId

        if (sessionStorage.getItem('sessionId')) {
            sessionId = sessionStorage.getItem('sessionId')
            console.log('Session ID already exists in sessionStorage.')
        } else {
            sessionId = setSessionId()

            // Create an object representing the data you want to send in the request body
            const postData = {
                userDetails: {
                    userId: agentId,
                    userName: agentName,
                    email: agentEmail,
                    sessionId: sessionId
                },
                operationInfo: {
                    channelId: channelId,
                    channelName: channelName
                }
            }

            // console.log(JSON.stringify(postData))
            // Make the POST request using the fetch API
            fetch(setAgentDetailsApiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(postData)
            }).then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`)
                } else {
                    console.log(JSON.stringify(postData))
                    console.log('OK')
                    console.log('User Details successfully sent to Kafka.')
                }
            })
        }
    }
    setAgentDetailsCopy = setAgentDetails

    /**
     * Scheduler module for reading and sending tracking data.
     * @namespace
     */
    window.scheduler = () => {
        // Reads and sends tracking data to a Kafka producer API.
        const readAndSendData = () => {
            let trackingDataKeys = Object.keys(localStorage).filter(key => key.startsWith('trackingData_'))

            if (trackingDataKeys.length === 0) {
                console.log('No tracking data in Local Storage!')
                return
            }

            trackingDataKeys.forEach(key => {
                let data = localStorage.getItem(key)

                // Call Kafka producer API to store data in Kafka topic
                callKafkaProducerAPI(data)

                // Delete data from Local Storage
                localStorage.removeItem(key)
            })
        }

        /**
         * Calls the Kafka producer API to store data in a Kafka topic.
         * @param {string} data - Tracking data to be sent to Kafka.
         */
        const callKafkaProducerAPI = data => {
            // Code to call the Kafka producer API here
            fetch(callKafkaProducerApiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                //   body: JSON.stringify(data),
                body: data
            })
                .then(response => {
                    if (response.ok) {
                        console.log('Event Data sent to Kafka API successfully.')
                    } else {
                        console.error('Failed to send event data to Kafka API.')
                    }
                })
                .catch(error => {
                    console.error('Failed to send event data to Kafka:', error)
                })
        }

        /**
         * Schedules the task to run initially and every 15 seconds.
         */
        const scheduleTask = () => {
            // Run the task initially and every 15 seconds
            readAndSendData()
            setInterval(readAndSendData, 15000)
        }
        scheduleTask()
        // Expose only the scheduleTask function to the outside world
        // return {
        //   scheduleTask: scheduleTask
        // }
    }
} catch (error) {
    console.log(error)
}
export { setAgentDetailsCopy }