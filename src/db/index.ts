import { neon } from '@neondatabase/serverless'
const sql = neon(process.env.DATABASE_URL!)

import type { Chat, ChatWithMessages, Message } from '../types'

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error)
  process.exit(1)
})

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason)
  process.exit(1)
})

export async function createChat(
  userEmail: string,
  name: string,
  msgs: Message[]
): Promise<number> {
  try {
    await sql`INSERT INTO chats (user_email, name) VALUES (${userEmail}, ${name})`

    const [{ currval: chatId }] = await sql`
    SELECT currval(pg_get_serial_sequence('chats', 'id')) AS currval
    `

    const insertMessages = msgs.map(
      (msg) =>
        sql`INSERT INTO messages (chat_id, role, content) VALUES (${Number(
          chatId
        )}, ${msg.role}, ${msg.content})`
    )
    await Promise.all(insertMessages)

    return Number(chatId)
  } catch (error) {
    console.error('Error creating chat:', error)
    throw new Error('Could not create chat')
  }
}

export async function getChat(
  chatId: number
): Promise<ChatWithMessages | null> {
  try {
    const [chat] = await sql`SELECT * FROM chats WHERE id = ${chatId}`
    if (!chat) return null

    const messages = await sql`SELECT * FROM messages WHERE chat_id = ${chatId}`
    return {
      ...chat,
      messages: messages.map((msg) => ({
        ...msg,
        role: msg.role as 'user' | 'assistant',
        content: msg.content
      }))
    } as ChatWithMessages
  } catch (error) {
    console.error('Error fetching chat:', error)
    throw new Error('Could not fetch chat')
  }
}

export async function getChats(userEmail: string): Promise<Chat[]> {
  try {
    const chats = await sql`
      SELECT * FROM chats
      WHERE user_email = ${userEmail}
      ORDER BY timestamp DESC
      LIMIT 3
    `
    return chats.map((chat) => ({
      ...chat
    })) as Chat[]
  } catch (error) {
    console.error('Error fetching chats:', error)
    throw new Error('Could not fetch chats')
  }
}

export async function getChatsWithMessages(
  userEmail: string
): Promise<ChatWithMessages[]> {
  try {
    const chats = await sql`
      SELECT * FROM chats
      WHERE user_email = ${userEmail}
      ORDER BY timestamp DESC
      LIMIT 3
    `

    const chatWithMessagesPromises = chats.map(async (chat) => {
      const messages =
        await sql`SELECT * FROM messages WHERE chat_id = ${chat.id}`
      return {
        id: chat.id,
        name: chat.name,
        user_email: chat.user_email,
        timestamp: chat.timestamp,
        messages: messages.map((msg) => ({
          id: msg.id,
          chat_id: msg.chat_id,
          role: msg.role as 'user' | 'assistant',
          content: msg.content
        }))
      }
    })

    return await Promise.all(chatWithMessagesPromises)
  } catch (error) {
    console.error('Error fetching chats with messages:', error)
    throw new Error('Could not fetch chats with messages')
  }
}

export async function getMessages(chatId: number) {
  try {
    const messages = await sql`
      SELECT * FROM messages
      WHERE chat_id = ${chatId}
    `
    return messages.map((msg) => ({
      ...msg,
      role: msg.role as 'user' | 'assistant',
      content: msg.content
    }))
  } catch (error) {
    console.error('Error fetching messages:', error)
    throw new Error('Could not fetch messages')
  }
}

export async function updateChat(chatId: number, msgs: Message[]) {
  try {
    await sql`BEGIN`
    await sql`DELETE FROM messages WHERE chat_id = ${chatId}`

    const insertMessages = msgs.map(
      (msg) =>
        sql`INSERT INTO messages (chat_id, role, content) VALUES (${chatId}, ${msg.role}, ${msg.content})`
    )
    await Promise.all(insertMessages)

    await sql`COMMIT`
  } catch (error) {
    await sql`ROLLBACK`
    console.error('Error updating chat:', error)
    throw new Error('Could not update chat')
  }
}
