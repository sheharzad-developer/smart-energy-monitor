'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2 } from 'lucide-react';
import { aiAPI } from '@/lib/api';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  data?: any;
}

export default function AIChat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: "Hi! I'm your AI energy assistant. You can ask me questions like:\n\n• 'Which device used the most energy yesterday?'\n• 'What's the total energy consumption this week?'\n• 'Show me the average usage for my fridge'\n\nWhat would you like to know?",
      sender: 'ai',
      timestamp: new Date(),
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await aiAPI.query(inputValue);
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: response.response || 'I apologize, but I couldn\'t process your request at the moment.',
        sender: 'ai',
        timestamp: new Date(),
        data: response.result,
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('AI query error:', error);
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: 'I\'m sorry, I\'m having trouble connecting to the energy data right now. Please try again later.',
        sender: 'ai',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const formatMessageContent = (content: string, data?: any) => {
    // If there's structured data, we can enhance the display
    if (data && data.type) {
      switch (data.type) {
        case 'highest_usage':
        case 'lowest_usage':
          if (data.devices && data.devices.length > 0) {
            return (
              <div className="space-y-2">
                <p className="mb-3">{content}</p>
                <div className="bg-gray-50 rounded-lg p-3">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Device Rankings:</h4>
                  {data.devices.slice(0, 3).map((device: any, index: number) => (
                    <div key={device.device_id} className="flex justify-between items-center py-1">
                      <span className="text-sm text-gray-600">
                        {index + 1}. {device.device_name}
                      </span>
                      <span className="text-sm font-medium text-gray-900">
                        {parseFloat(device.total_watts).toFixed(2)}W
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          }
          break;
        
        case 'comparison':
          if (data.devices && data.devices.length > 0) {
            return (
              <div className="space-y-2">
                <p className="mb-3">{content}</p>
                <div className="bg-gray-50 rounded-lg p-3">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Energy Comparison:</h4>
                  {data.devices.map((device: any) => (
                    <div key={device.device_id} className="flex justify-between items-center py-1 border-b border-gray-200 last:border-b-0">
                      <span className="text-sm text-gray-600">{device.device_name}</span>
                      <span className="text-sm font-medium text-gray-900">
                        {parseFloat(device.total_watts).toFixed(2)}W
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          }
          break;
          
        case 'summary':
          if (data.overall) {
            return (
              <div className="space-y-2">
                <p className="mb-3">{content}</p>
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Total Energy:</span>
                      <br />
                      <span className="font-medium text-gray-900">
                        {parseFloat(data.overall.total_watts || 0).toFixed(2)}W
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Active Devices:</span>
                      <br />
                      <span className="font-medium text-gray-900">
                        {data.overall.device_count || 0}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          }
          break;
      }
    }

    return <p>{content}</p>;
  };

  const quickQuestions = [
    "Which device used the most energy yesterday?",
    "What's my total energy consumption this week?",
    "Show me the average usage for each device",
    "Compare energy usage between all devices",
  ];

  return (
    <div className="flex flex-col h-96 bg-white border border-gray-200 rounded-lg">
      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`flex items-start space-x-2 max-w-xs lg:max-w-md ${
              message.sender === 'user' ? 'flex-row-reverse space-x-reverse' : ''
            }`}>
              <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
                message.sender === 'user' 
                  ? 'bg-primary-600 text-white' 
                  : 'bg-gray-200 text-gray-600'
              }`}>
                {message.sender === 'user' ? (
                  <User className="w-4 h-4" />
                ) : (
                  <Bot className="w-4 h-4" />
                )}
              </div>
              
              <div className={`px-3 py-2 rounded-lg ${
                message.sender === 'user'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-900'
              }`}>
                <div className="text-sm">
                  {formatMessageContent(message.content, message.data)}
                </div>
                <div className={`text-xs mt-1 ${
                  message.sender === 'user' ? 'text-primary-200' : 'text-gray-500'
                }`}>
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="flex items-start space-x-2">
              <div className="flex-shrink-0 w-6 h-6 bg-gray-200 text-gray-600 rounded-full flex items-center justify-center">
                <Bot className="w-4 h-4" />
              </div>
              <div className="px-3 py-2 bg-gray-100 text-gray-900 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">Analyzing your energy data...</span>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Questions */}
      {messages.length === 1 && (
        <div className="px-4 py-2 border-t border-gray-100">
          <div className="text-xs text-gray-500 mb-2">Quick questions:</div>
          <div className="flex flex-wrap gap-2">
            {quickQuestions.map((question, index) => (
              <button
                key={index}
                onClick={() => setInputValue(question)}
                className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-700 transition-colors"
              >
                {question}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-gray-200">
        <div className="flex space-x-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Ask about your energy usage..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || isLoading}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
} 