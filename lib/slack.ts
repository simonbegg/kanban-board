import { createClient } from '@/lib/supabase'

const SLACK_CLIENT_ID = process.env.NEXT_PUBLIC_SLACK_CLIENT_ID
const SLACK_CLIENT_SECRET = process.env.SLACK_CLIENT_SECRET
const SLACK_REDIRECT_URI = process.env.NEXT_PUBLIC_SLACK_REDIRECT_URI || `${process.env.NEXT_PUBLIC_APP_URL}/api/slack/callback`

export interface SlackProfile {
  access_token: string
  user_id: string
  team_id: string
  channel_id?: string
}

/**
 * Generate Slack OAuth URL for user authorization
 */
export function getSlackAuthUrl(userId: string): string {
  const scopes = [
    'chat:write',
    'channels:read',
    'users:read',
  ].join(',')

  const params = new URLSearchParams({
    client_id: SLACK_CLIENT_ID || '',
    scope: scopes,
    redirect_uri: SLACK_REDIRECT_URI || '',
    state: userId, // Pass user ID to verify on callback
  })

  return `https://slack.com/oauth/v2/authorize?${params.toString()}`
}

/**
 * Exchange OAuth code for access token
 */
export async function exchangeSlackCode(code: string): Promise<SlackProfile> {
  const response = await fetch('https://slack.com/api/oauth.v2.access', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: SLACK_CLIENT_ID || '',
      client_secret: SLACK_CLIENT_SECRET || '',
      code,
      redirect_uri: SLACK_REDIRECT_URI || '',
    }),
  })

  const data = await response.json()

  if (!data.ok) {
    throw new Error(`Slack OAuth error: ${data.error}`)
  }

  return {
    access_token: data.access_token,
    user_id: data.authed_user.id,
    team_id: data.team.id,
  }
}

/**
 * Save Slack credentials to user profile
 */
export async function saveSlackCredentials(userId: string, profile: SlackProfile): Promise<void> {
  const supabase = createClient()

  const { error } = await supabase
    .from('profiles')
    .update({
      slack_access_token: profile.access_token,
      slack_user_id: profile.user_id,
      slack_team_id: profile.team_id,
      slack_channel_id: profile.channel_id,
      slack_connected_at: new Date().toISOString(),
    })
    .eq('id', userId)

  if (error) {
    throw new Error(`Failed to save Slack credentials: ${error.message}`)
  }
}

/**
 * Disconnect Slack integration
 */
export async function disconnectSlack(userId: string): Promise<void> {
  const supabase = createClient()

  const { error } = await supabase
    .from('profiles')
    .update({
      slack_access_token: null,
      slack_user_id: null,
      slack_team_id: null,
      slack_channel_id: null,
      slack_connected_at: null,
    })
    .eq('id', userId)

  if (error) {
    throw new Error(`Failed to disconnect Slack: ${error.message}`)
  }
}

/**
 * Send a message to Slack
 */
export async function sendSlackMessage(
  accessToken: string,
  channel: string,
  text: string,
  blocks?: any[]
): Promise<void> {
  const response = await fetch('https://slack.com/api/chat.postMessage', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      channel,
      text,
      blocks,
    }),
  })

  const data = await response.json()

  if (!data.ok) {
    throw new Error(`Slack API error: ${data.error}`)
  }
}

/**
 * Get user's DM channel ID
 */
export async function getSlackDMChannel(accessToken: string, userId: string): Promise<string> {
  const response = await fetch('https://slack.com/api/conversations.open', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      users: userId,
    }),
  })

  const data = await response.json()

  if (!data.ok) {
    throw new Error(`Failed to open DM channel: ${data.error}`)
  }

  return data.channel.id
}

/**
 * Format task notification for Slack
 */
export function formatTaskNotification(task: {
  title: string
  description?: string
  category: string
  ageInDays: number
  boardTitle: string
}): { text: string; blocks: any[] } {
  const text = `⏰ Card "${task.title}" has been waiting for ${task.ageInDays} days`

  const blocks = [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*⏰ Old Card Alert*\n\nThe card *"${task.title}"* has been sitting in your board for *${task.ageInDays} days*.`,
      },
    },
    {
      type: 'section',
      fields: [
        {
          type: 'mrkdwn',
          text: `*Board:*\n${task.boardTitle}`,
        },
        {
          type: 'mrkdwn',
          text: `*Category:*\n${task.category}`,
        },
      ],
    },
  ]

  if (task.description) {
    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*Description:*\n${task.description}`,
      },
    })
  }

  blocks.push({
    type: 'context',
    elements: [
      {
        type: 'mrkdwn',
        text: `💡 Consider moving this card forward or archiving it if it's no longer relevant.`,
      },
    ],
  } as any)

  return { text, blocks }
}
