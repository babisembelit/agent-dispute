use std::collections::HashMap;
use reqwest::Client;

pub struct IpfsService {
    client: Client,
    gateway: String,
    pinata_token: Option<String>,
    cid_map: HashMap<String, String>,
}

impl IpfsService {
    pub fn new(gateway: String, pinata_token: Option<String>) -> Self {
        let cid_map = std::fs::read_to_string("cid_map.json")
            .ok()
            .and_then(|s| serde_json::from_str(&s).ok())
            .unwrap_or_default();

        Self {
            client: Client::new(),
            gateway,
            pinata_token,
            cid_map,
        }
    }

    pub async fn fetch_content(&self, content_hash: &[u8; 32]) -> Option<String> {
        let hex = hex::encode(content_hash);

        let cid = self.cid_map.get(&hex)?;

        let url = format!("{}/ipfs/{}", self.gateway.trim_end_matches('/'), cid);

        let mut req = self.client.get(&url);
        if let Some(token) = &self.pinata_token {
            req = req.header("Authorization", format!("Bearer {}", token));
        }

        req.send().await.ok()?.text().await.ok()
    }
}
