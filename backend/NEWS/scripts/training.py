import os
import sys
import torch
import pandas as pd
import numpy as np
from transformers import AutoTokenizer, AutoModelForSequenceClassification, Trainer, TrainingArguments
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, precision_recall_fscore_support

# Ensure project root in PATH
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
if project_root not in sys.path:
    sys.path.append(project_root)

def main():
    print("Initializing Training Pipeline...")
    
    # Define paths
    script_dir = os.path.dirname(__file__)
    csv_path = os.path.join(script_dir, 'labeled_financial_news.csv')
    cache_dir = os.path.join(project_root, 'NEWS', 'models', 'finbert_cache')
    
    # 1. Load/Generate Labeled Data
    if not os.path.exists(csv_path):
        print(f"Creating dummy labeled dataset at: {csv_path}")
        df_dummy = pd.DataFrame({
            'text': ['Bitcoin price spikes to new heights!', 'Market crashes as regulatory fears increase.', 'The price of BTC remains stable today.'] * 10,
            'label': [0, 1, 2] * 10
        })
        df_dummy.to_csv(csv_path, index=False)
        
    df = pd.read_csv(csv_path)
    print(f"Loaded {len(df)} records. Preview:")
    print(df.head())
    
    # 2. Train-Test Split
    train_texts, val_texts, train_labels, val_labels = train_test_split(
        df['text'].tolist(),
        df['label'].tolist(),
        test_size=0.2,
        random_state=42
    )
    print(f"Train size: {len(train_texts)}, Val size: {len(val_texts)}")
    
    # 3. Tokenizer & Dataset Setup
    print("Loading FinBERT tokenizer...")
    tokenizer = AutoTokenizer.from_pretrained('ProsusAI/finbert', cache_dir=cache_dir)
    
    class NewsDataset(torch.utils.data.Dataset):
        def __init__(self, texts, labels, tokenizer):
            self.encodings = tokenizer(texts, truncation=True, padding=True, max_length=512)
            self.labels = labels

        def __getitem__(self, idx):
            item = {key: torch.tensor(val[idx]) for key, val in self.encodings.items()}
            item['labels'] = torch.tensor(self.labels[idx])
            return item

        def __len__(self):
            return len(self.labels)

    train_dataset = NewsDataset(train_texts, train_labels, tokenizer)
    val_dataset = NewsDataset(val_texts, val_labels, tokenizer)
    
    # 4. Fine-Tuning Setup
    print("Loading FinBERT model...")
    model = AutoModelForSequenceClassification.from_pretrained(
        'ProsusAI/finbert',
        num_labels=3,
        cache_dir=cache_dir
    )
    
    def compute_metrics(pred):
        labels = pred.label_ids
        preds = pred.predictions.argmax(-1)
        precision, recall, f1, _ = precision_recall_fscore_support(labels, preds, average='weighted')
        acc = accuracy_score(labels, preds)
        return {
            'accuracy': acc,
            'f1': f1,
            'precision': precision,
            'recall': recall
        }
        
    # Set output and logging directories inside NEWS/scripts/results and NEWS/scripts/logs
    output_dir = os.path.join(script_dir, 'results')
    logging_dir = os.path.join(script_dir, 'logs')
    
    training_args = TrainingArguments(
        output_dir=output_dir,
        num_train_epochs=3,
        per_device_train_batch_size=8,
        per_device_eval_batch_size=8,
        warmup_steps=500,
        weight_decay=0.01,
        logging_dir=logging_dir,
        logging_steps=10,
        eval_strategy="epoch"
    )
    
    trainer = Trainer(
        model=model,
        args=training_args,
        train_dataset=train_dataset,
        eval_dataset=val_dataset,
        compute_metrics=compute_metrics
    )
    
    print("Trainer successfully configured.")
    # Commented out active training for quick verification/customization
    # print("Starting training...")
    # trainer.train()
    # save_path = os.path.join(project_root, 'NEWS', 'models', 'finbert_custom_tuned')
    # trainer.save_model(save_path)
    # print(f"Model saved to {save_path}")

if __name__ == '__main__':
    main()
