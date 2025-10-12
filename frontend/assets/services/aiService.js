// aiService.js - Safe version without problematic imports

import { GROQ_API_KEY } from '@env';
import { FirebaseService } from '../../backend/Firebase/FirebaseService';

/**
 * Safety Word Detection - Triggers emergency AI agent
 */
export const detectSafetyWord = (userMessage) => {
  const safetyWords = ['help', 'emergency', 'danger', 'sos', 'police'];
  const lower = userMessage.toLowerCase().trim();
  
  return safetyWords.some(word => 
    lower === word || 
    lower.split(/\s+/).includes(word) ||
    new RegExp(`\\b${word}\\b`, 'i').test(lower)
  );
};

/**
 * Get AI Response for chatbot with comprehensive fallback
 */
export const getAIResponse = async (userMessage) => {
  try {
    // Check if we have a valid API key
    if (!GROQ_API_KEY || GROQ_API_KEY.trim() === '' || GROQ_API_KEY === 'undefined') {
      console.log("No API key available, using fallback");
      return getFallbackResponse(userMessage);
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [
          {
            role: "system",
            content: `You are AlertNet Assistant — a smart, friendly, and reliable AI companion built into the AlertNet safety app. 
Your goal is to help users stay safe, informed, and connected. 
You must:
• Greet users warmly and stay polite, calm, and clear.  
• Focus only on topics related to safety, emergencies, walk partners, friends, notifications, and app navigation.  
• Offer step-by-step instructions or short, practical explanations.  
• If a user asks something unrelated, gently guide them back to safety or app topics.  
• Keep answers short, conversational, and easy to understand.  
• Never give medical, legal, or dangerous advice. Instead, tell users to contact emergency services.
• Use emojis sparingly (🚨 for emergencies, 📍 for location, 👥 for friends, 🛡️ for safety zones).
End every message on a helpful or reassuring note.`
          },
          { role: "user", content: userMessage }
        ],
        temperature: 0.7,
        max_tokens: 200,
        top_p: 0.9,
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.log(`API returned ${response.status}, using fallback`);
      return getFallbackResponse(userMessage);
    }

    const data = await response.json();
    const aiMessage = data?.choices?.[0]?.message?.content?.trim();
    
    if (!aiMessage || aiMessage.length < 10) {
      console.log("Invalid AI response, using fallback");
      return getFallbackResponse(userMessage);
    }
    
    return aiMessage;
    
  } catch (error) {
    console.log(`AI Service Error: ${error.message}, using fallback`);
    return getFallbackResponse(userMessage);
  }
};

/**
 * Smart fallback response generator
 */
const getFallbackResponse = (userMessage) => {
  const lower = userMessage.toLowerCase();
  
  // Emergency responses
  if (lower.includes('sos') || lower.includes('emergency') || lower.includes('911')) {
    return "🚨 For immediate emergency assistance:\n\n1. Type 'help' to activate emergency mode\n2. Tap the SOS button on the home screen\n3. Call 911 directly\n\nStay safe!";
  }
  
  // Friend/contact management
  if (lower.includes('friend') || lower.includes('contact') || lower.includes('add') || lower.includes('people')) {
    return "👥 Managing Friends:\n\n• To add a friend, type: 'Add [name] [phone]'\n• Example: 'Add Sarah 0821234567'\n• Or tap the '+add' button\n• Go to 'People' tab to view friends\n\nLet me know if you need help!";
  }
  
  // Walk partner
  if (lower.includes('walk') || lower.includes('escort') || lower.includes('journey')) {
    return "🚶 Walk Partner Feature:\n\n• Activate it to share your location during a journey\n• Your trusted contacts will track you in real-time\n• You'll be notified if you deviate from your route\n\nWould you like to start a walk partner session?";
  }
  
  // Safety zones
  if (lower.includes('safe') || lower.includes('zone') || lower.includes('area')) {
    return "🛡️ Safety Zones:\n\n• Create safe zones at frequently visited places\n• Get alerts when entering/leaving zones\n• Share zones with trusted contacts\n\nTap the map to create a safety zone!";
  }
  
  // Location/tracking
  if (lower.includes('location') || lower.includes('where') || lower.includes('track')) {
    return "📍 Location Services:\n\n• Share your real-time location with friends\n• View friends' locations on the map\n• Set up geofencing alerts\n\nCheck the map screen for more options!";
  }
  
  // Greetings
  if (lower.match(/^(hi|hello|hey|good\s+(morning|afternoon|evening))/)) {
    return "Hello! 👋 I'm your AlertNet Assistant.\n\nI can help you with:\n• 🚨 Emergency assistance\n• 👥 Friend management\n• 🚶 Walk partner\n• 🛡️ Safety zones\n\nWhat would you like to do?";
  }
  
  // Help/info requests
  if (lower.includes('help') || lower.includes('how') || lower.includes('what can')) {
    return "I'm here to help! 😊\n\n✨ Quick commands:\n• 'Add [name] [phone]' - Send friend request\n• 'SOS' - Emergency mode\n• 'Walk Partner' - Start tracking\n\n🎯 Main features:\n• Emergency SOS\n• Friend tracking\n• Safety zones\n• Location sharing\n\nWhat would you like to try?";
  }
  
  // Thank you
  if (lower.includes('thank') || lower.includes('thanks')) {
    return "You're welcome! 😊 I'm always here to help keep you safe. Is there anything else you'd like to know?";
  }
  
  // Default response
  return "I can help you with:\n\n🚨 Emergency SOS\n👥 Friends & Contacts\n🛡️ Safety Zones\n🚶 Walk Partner\n\nTry asking me about any of these features, or type 'Add [name] [phone]' to send a friend request!";
};

/**
 * Analyze emergency urgency
 */
export const analyzeEmergencyUrgency = async (userMessage) => {
  try {
    if (!GROQ_API_KEY || GROQ_API_KEY.trim() === '' || GROQ_API_KEY === 'undefined') {
      return analyzeUrgencyLocally(userMessage);
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [
          {
            role: "system",
            content: `Analyze urgency and respond ONLY with JSON:
{
  "urgency": "critical" | "high" | "medium" | "low",
  "reason": "brief explanation",
  "suggestedAction": "specific action",
  "keywords": ["detected", "keywords"]
}`
          },
          { role: "user", content: userMessage }
        ],
        temperature: 0.3,
        max_tokens: 150,
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return analyzeUrgencyLocally(userMessage);
    }

    const data = await response.json();
    const aiResponse = data?.choices?.[0]?.message?.content?.trim();
    
    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    return analyzeUrgencyLocally(userMessage);
    
  } catch (error) {
    return analyzeUrgencyLocally(userMessage);
  }
};

const analyzeUrgencyLocally = (message) => {
  const lower = message.toLowerCase();
  
  const criticalKeywords = ['help', 'emergency', 'danger', 'attack', 'hurt', 'following', 'scared', 'threatening', '911', 'police'];
  const highKeywords = ['unsafe', 'suspicious', 'worried', 'alone', 'dark', 'uncomfortable', 'nervous'];
  const mediumKeywords = ['concern', 'question', 'advice', 'plan', 'later', 'tomorrow'];
  
  const foundCritical = criticalKeywords.some(kw => lower.includes(kw));
  const foundHigh = highKeywords.some(kw => lower.includes(kw));
  const foundMedium = mediumKeywords.some(kw => lower.includes(kw));
  
  if (foundCritical) {
    return {
      urgency: 'critical',
      reason: 'Detected emergency keywords indicating immediate danger',
      suggestedAction: 'Trigger SOS and call emergency services immediately',
      keywords: criticalKeywords.filter(kw => lower.includes(kw))
    };
  } else if (foundHigh) {
    return {
      urgency: 'high',
      reason: 'User feels unsafe or uncomfortable',
      suggestedAction: 'Activate walk partner and alert emergency contacts',
      keywords: highKeywords.filter(kw => lower.includes(kw))
    };
  } else if (foundMedium) {
    return {
      urgency: 'medium',
      reason: 'General safety planning or concerns',
      suggestedAction: 'Provide safety tips and app guidance',
      keywords: mediumKeywords.filter(kw => lower.includes(kw))
    };
  }
  
  return {
    urgency: 'low',
    reason: 'General inquiry or conversation',
    suggestedAction: 'Provide helpful information',
    keywords: []
  };
};

/**
 * Enhanced detectCommand with friend request extraction
 */
export const detectCommand = async (userMessage) => {
  try {
    if (!GROQ_API_KEY || GROQ_API_KEY.trim() === '' || GROQ_API_KEY === 'undefined') {
      return detectCommandLocally(userMessage);
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [
          {
            role: "system",
            content: `Detect commands and respond ONLY with JSON. For friend requests, extract name and phone number.
{
  "hasCommand": true/false,
  "command": "ADD_CONTACT" | "ACTIVATE_SOS" | "START_WALK_PARTNER" | "CREATE_SAFETY_ZONE" | "SHOW_CONTACTS" | "SHARE_LOCATION" | "VIEW_SAFETY_ZONES" | "NONE",
  "parameters": {
    "firstName": "extracted first name",
    "lastName": "extracted last name (if provided)",
    "phone": "extracted phone number"
  },
  "confidence": 0.0-1.0
}

Examples:
- "add my friend John Doe 0821234567" -> firstName: "John", lastName: "Doe", phone: "0821234567"
- "add contact Sarah +27821234567" -> firstName: "Sarah", phone: "+27821234567"
- "send friend request to Mike Smith 082-123-4567" -> firstName: "Mike", lastName: "Smith", phone: "0821234567"
`
          },
          { role: "user", content: userMessage }
        ],
        temperature: 0.2,
        max_tokens: 200,
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return detectCommandLocally(userMessage);
    }

    const data = await response.json();
    const aiResponse = data?.choices?.[0]?.message?.content?.trim();
    
    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    return detectCommandLocally(userMessage);
    
  } catch (error) {
    return detectCommandLocally(userMessage);
  }
};

const detectCommandLocally = (message) => {
  const lower = message.toLowerCase();
  
  // Check for add contact/friend request patterns
  if (lower.match(/add|new|create|send.*request/) && 
      (lower.match(/contact|friend/) || lower.match(/\d{3,}/))) {
    
    // Extract phone number (supports various formats)
    const phoneMatch = message.match(/(\+?27|0)?[\s-]?(\d{2})[\s-]?(\d{3})[\s-]?(\d{4})/);
    let phone = '';
    
    if (phoneMatch) {
      phone = phoneMatch[0].replace(/[\s-]/g, '');
    }
    
    // Extract names
    let firstName = '';
    let lastName = '';
    
    let nameText = message
      .replace(/add|new|create|send|request|contact|friend|to|my/gi, '')
      .replace(/\+?27|0?[\s-]?\d{2}[\s-]?\d{3}[\s-]?\d{4}/g, '')
      .trim();
    
    const nameParts = nameText.split(/\s+/).filter(part => 
      part.length > 1 && !/^\d+$/.test(part)
    );
    
    if (nameParts.length > 0) {
      firstName = nameParts[0];
      if (nameParts.length > 1) {
        lastName = nameParts.slice(1).join(' ');
      }
    }
    
    return {
      hasCommand: true,
      command: 'ADD_CONTACT',
      parameters: { 
        firstName: firstName || '',
        lastName: lastName || '',
        phone: phone || ''
      },
      confidence: (firstName && phone) ? 0.85 : 0.6
    };
  }
  
  if (lower.match(/sos|emergency|help\s+now|danger|alert/)) {
    return {
      hasCommand: true,
      command: 'ACTIVATE_SOS',
      parameters: {},
      confidence: 0.9
    };
  }
  
  if (lower.match(/walk\s+partner|start\s+walk|escort|walk\s+me/)) {
    const destMatch = message.match(/to\s+(\w+)/i);
    return {
      hasCommand: true,
      command: 'START_WALK_PARTNER',
      parameters: { destination: destMatch ? destMatch[1] : '' },
      confidence: 0.85
    };
  }
  
  if (lower.match(/create|add|new|set/) && lower.match(/safe\s*zone|safety\s*zone/)) {
    return {
      hasCommand: true,
      command: 'CREATE_SAFETY_ZONE',
      parameters: {},
      confidence: 0.8
    };
  }
  
  if (lower.match(/show|view|list|see/) && lower.match(/contact|friend|people/)) {
    return {
      hasCommand: true,
      command: 'SHOW_CONTACTS',
      parameters: {},
      confidence: 0.85
    };
  }
  
  return {
    hasCommand: false,
    command: 'NONE',
    parameters: {},
    confidence: 0
  };
};

/**
 * Process friend request through chatbot
 */
export const processFriendRequest = async (parameters, userPhone, userEmail, senderUserId) => {
  try {
    const { firstName, lastName, phone } = parameters;
    
    // Validation
    if (!firstName || !phone) {
      return {
        success: false,
        message: "I need both a name and phone number to send a friend request. Please provide:\n\n• First name\n• Phone number\n\nExample: 'Add my friend Sarah 0821234567'"
      };
    }
    
    if (phone.length < 10) {
      return {
        success: false,
        message: `The phone number "${phone}" seems too short. Please provide a complete phone number (e.g., 0821234567 or +27821234567).`
      };
    }
    
    // Check if user exists on platform
    console.log('Chatbot: Checking if user exists:', phone);
    const userCheck = await FirebaseService.checkUserExists(phone);
    
    if (userCheck.error) {
      return {
        success: false,
        message: "I couldn't verify this number right now. Please check your internet connection and try again."
      };
    }
    
    if (!userCheck.exists) {
      return {
        success: false,
        message: `${firstName} (${phone}) is not on AlertNet yet. They'll need to join the app before you can connect with them.`
      };
    }
    
    // Check for existing friend request
    console.log('Chatbot: Checking for existing requests');
    const existingRequest = await FirebaseService.checkExistingFriendRequest(
      userPhone, 
      phone
    );
    
    if (existingRequest.exists) {
      if (existingRequest.direction === 'outgoing') {
        return {
          success: false,
          message: `You've already sent a friend request to ${firstName}. They just need to accept it! 😊`
        };
      } else {
        return {
          success: false,
          message: `Good news! ${firstName} has already sent you a friend request. Check your notifications to accept it! 🎉`
        };
      }
    }
    
    // Send friend request
    console.log('Chatbot: Sending friend request');
    const result = await FirebaseService.sendFriendRequest({
      firstName: firstName.trim(),
      lastName: lastName ? lastName.trim() : '',
      phone: phone.trim(),
      senderPhone: userPhone,
      senderEmail: userEmail,
      senderUserId: senderUserId
    });
    
    if (result.success) {
      const fullName = lastName ? `${firstName} ${lastName}` : firstName;
      return {
        success: true,
        message: `✅ Friend request sent successfully!\n\n👤 ${fullName}\n📱 ${phone}\n\n${firstName} will be notified and can accept your request. You'll get a notification once they respond! 🎉`
      };
    } else {
      return {
        success: false,
        message: result.message || result.error || "I couldn't send the friend request. Please try again."
      };
    }
    
  } catch (error) {
    console.error('Error in processFriendRequest:', error);
    return {
      success: false,
      message: "Something went wrong while sending the friend request. Please try again or use the '+add' button."
    };
  }
};