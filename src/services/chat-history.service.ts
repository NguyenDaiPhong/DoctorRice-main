/**
 * Chat History Service
 * Manage chat history - save conversations that can be continued later
 * User can manually archive/delete conversations
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ChatMessage } from './gemini.service';

const CHAT_CONVERSATIONS_KEY = 'chat_conversations';

export interface ChatConversation {
  id: string;
  title: string; // First message or custom title
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
  isArchived: boolean;
}

/**
 * Get all conversations (including archived)
 */
const getAllConversations = async (): Promise<ChatConversation[]> => {
  try {
    const conversationsStr = await AsyncStorage.getItem(CHAT_CONVERSATIONS_KEY);
    if (!conversationsStr) {
      return [];
    }
    return JSON.parse(conversationsStr);
  } catch (error) {
    console.error('❌ Failed to get conversations:', error);
    return [];
  }
};

/**
 * Save conversations to storage
 */
const saveConversations = async (conversations: ChatConversation[]): Promise<void> => {
  try {
    await AsyncStorage.setItem(CHAT_CONVERSATIONS_KEY, JSON.stringify(conversations));
  } catch (error) {
    console.error('❌ Failed to save conversations:', error);
  }
};

/**
 * Get active (non-archived) conversations
 */
export const getActiveConversations = async (): Promise<ChatConversation[]> => {
  const all = await getAllConversations();
  return all.filter(conv => !conv.isArchived);
};

/**
 * Get current/last active conversation
 */
export const getCurrentConversation = async (): Promise<ChatConversation | null> => {
  const active = await getActiveConversations();
  return active.length > 0 ? active[active.length - 1] : null;
};

/**
 * Create new conversation
 */
export const createNewConversation = async (title?: string): Promise<ChatConversation> => {
  const conversations = await getAllConversations();
  const newConv: ChatConversation = {
    id: `conv_${Date.now()}`,
    title: title || 'Cuộc trò chuyện mới',
    messages: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
    isArchived: false,
  };
  
  conversations.push(newConv);
  await saveConversations(conversations);
  console.log('✅ New conversation created:', newConv.id);
  return newConv;
};

/**
 * Add message to current conversation
 */
export const addMessageToConversation = async (
  conversationId: string,
  message: ChatMessage
): Promise<void> => {
  try {
    const conversations = await getAllConversations();
    const conv = conversations.find(c => c.id === conversationId);
    
    if (!conv) {
      console.error('❌ Conversation not found:', conversationId);
      return;
    }
    
    conv.messages.push(message);
    conv.updatedAt = Date.now();
    
    // Update title with first user message if still default
    if (conv.title === 'Cuộc trò chuyện mới' && message.role === 'user' && message.content) {
      conv.title = message.content.substring(0, 50) + (message.content.length > 50 ? '...' : '');
    }
    
    await saveConversations(conversations);
    console.log('💾 Message saved to conversation:', conversationId);
  } catch (error) {
    console.error('❌ Failed to add message:', error);
  }
};

/**
 * Get conversation by ID
 */
export const getConversationById = async (conversationId: string): Promise<ChatConversation | null> => {
  const conversations = await getAllConversations();
  return conversations.find(c => c.id === conversationId) || null;
};

/**
 * Rename conversation
 */
export const renameConversation = async (conversationId: string, newTitle: string): Promise<void> => {
  try {
    const conversations = await getAllConversations();
    const conv = conversations.find(c => c.id === conversationId);
    
    if (conv) {
      conv.title = newTitle.trim();
      conv.updatedAt = Date.now();
      await saveConversations(conversations);
      console.log('✏️ Conversation renamed:', conversationId, newTitle);
    }
  } catch (error) {
    console.error('❌ Failed to rename conversation:', error);
  }
};

/**
 * Archive conversation (soft delete - can be unarchived later)
 */
export const archiveConversation = async (conversationId: string): Promise<void> => {
  try {
    const conversations = await getAllConversations();
    const conv = conversations.find(c => c.id === conversationId);
    
    if (conv) {
      conv.isArchived = true;
      conv.updatedAt = Date.now();
      await saveConversations(conversations);
      console.log('📦 Conversation archived:', conversationId);
    }
  } catch (error) {
    console.error('❌ Failed to archive conversation:', error);
  }
};

/**
 * Unarchive conversation
 */
export const unarchiveConversation = async (conversationId: string): Promise<void> => {
  try {
    const conversations = await getAllConversations();
    const conv = conversations.find(c => c.id === conversationId);
    
    if (conv) {
      conv.isArchived = false;
      conv.updatedAt = Date.now();
      await saveConversations(conversations);
      console.log('📤 Conversation unarchived:', conversationId);
    }
  } catch (error) {
    console.error('❌ Failed to unarchive conversation:', error);
  }
};

/**
 * Delete conversation permanently
 */
export const deleteConversation = async (conversationId: string): Promise<void> => {
  try {
    const conversations = await getAllConversations();
    const filtered = conversations.filter(c => c.id !== conversationId);
    await saveConversations(filtered);
    console.log('🗑️ Conversation deleted:', conversationId);
  } catch (error) {
    console.error('❌ Failed to delete conversation:', error);
  }
};

/**
 * Clear all conversations (delete everything)
 */
export const clearAllConversations = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(CHAT_CONVERSATIONS_KEY);
    console.log('🗑️ All conversations cleared');
  } catch (error) {
    console.error('❌ Failed to clear all conversations:', error);
  }
};

// DEPRECATED: Keep for backward compatibility
export const getChatHistory = async (): Promise<ChatMessage[]> => {
  const conv = await getCurrentConversation();
  return conv ? conv.messages : [];
};

export const clearChatHistory = async (): Promise<void> => {
  const conv = await getCurrentConversation();
  if (conv) {
    await archiveConversation(conv.id);
  }
};

