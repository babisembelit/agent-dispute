use reqwest::Client;
use serde::{Deserialize, Serialize};
use hex;

pub struct LLMService {
    client: Client,
    openai_key: Option<String>,
}

#[derive(Serialize)]
struct Message {
    role: String,
    content: String,
}

#[derive(Serialize)]
struct OpenAIRequest {
    model: String,
    messages: Vec<Message>,
}

#[derive(Deserialize)]
struct OpenAIChoice {
    message: MessageResponse,
}

#[derive(Deserialize)]
struct MessageResponse {
    content: String,
}

#[derive(Deserialize)]
struct OpenAIResponse {
    choices: Vec<OpenAIChoice>,
}

pub struct EvaluationResult {
    pub vote: u8,
    pub reasoning_hash: [u8; 32],
}

#[derive(Deserialize)]
struct LLMVoteResponse {
    vote: u8,
    reasoning: String,
}

impl LLMService {
    pub fn new(openai_key: Option<String>) -> Self {
        Self {
            client: Client::new(),
            openai_key,
        }
    }

    pub async fn evaluate_dispute(
        &self,
        task_hash: &[u8],
        criteria_hash: &[u8],
        evidence_contents: &[String],
    ) -> Result<EvaluationResult, Box<dyn std::error::Error>> {
        if let Some(key) = &self.openai_key {
            let evidence_text = evidence_contents
                .iter()
                .enumerate()
                .map(|(i, c)| format!("Evidence {}: {}", i + 1, c))
                .collect::<Vec<_>>()
                .join("\n");

            let prompt = format!(
                "You are an AI Arbiter for the Agent Dispute Protocol.\n\
                 Task Hash: {}\nCriteria Hash: {}\n\n{}\n\n\
                 Analyze the evidence against the criteria.\n\
                 Reply strictly with a JSON object: {{\"vote\": 1, \"reasoning\": \"...\"}} where 1=Agent A wins, 2=Agent B wins.",
                hex::encode(task_hash),
                hex::encode(criteria_hash),
                evidence_text,
            );

            let req_body = OpenAIRequest {
                model: "gpt-4-turbo".to_string(),
                messages: vec![Message {
                    role: "user".to_string(),
                    content: prompt,
                }],
            };

            let res = self.client.post("https://api.openai.com/v1/chat/completions")
                .header("Authorization", format!("Bearer {}", key))
                .json(&req_body)
                .send()
                .await?;

            let openai_res: OpenAIResponse = res.json().await?;
            let content = &openai_res.choices[0].message.content;

            let parsed: LLMVoteResponse = serde_json::from_str(content)?;
            let reasoning_hash = solana_sdk::hash::hash(parsed.reasoning.as_bytes()).to_bytes();

            Ok(EvaluationResult { vote: parsed.vote, reasoning_hash })
        } else {
            // Fallback mock if no API key
            let reasoning_hash = solana_sdk::hash::hash(b"Fallback Mock Reasoning").to_bytes();
            Ok(EvaluationResult { vote: 2, reasoning_hash }) // Default to B
        }
    }
}
