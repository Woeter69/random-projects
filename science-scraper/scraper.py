import os
import requests
import re
import pandas as pd
from Bio import Entrez
from elsapy.elsclient import ElsClient
from elsapy.elssearch import ElsSearch
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configuration
USER_EMAIL = os.getenv("EMAIL", "adityabhagora@cic.du.ac.in")
Entrez.email = USER_EMAIL
ELSEVIER_API_KEY = os.getenv("ELSEVIER_API_KEY")
DATA_DIR = "data"

if not os.path.exists(DATA_DIR):
    os.makedirs(DATA_DIR)

# Initialize Elsevier Client
els_client = ElsClient(ELSEVIER_API_KEY)

def search_pubmed(query, max_results=25):
    print(f"\n--- Searching PubMed for: '{query}' ---")
    handle = Entrez.esearch(db="pubmed", term=query, retmax=max_results)
    record = Entrez.read(handle)
    handle.close()
    
    ids = record["IdList"]
    if not ids:
        print("No results found on PubMed.")
        return []

    fetch_handle = Entrez.efetch(db="pubmed", id=",".join(ids), rettype="medline", retmode="text")
    from Bio import Medline
    records = Medline.parse(fetch_handle)
    
    results = []
    for record in records:
        title = record.get("TI", "No Title")
        doi = record.get("AID", [""])[0].replace(" [doi]", "") if "AID" in record else ""
        pmid = record.get("PMID", "")
        results.append({
            "Source": "PubMed",
            "Title": title,
            "DOI": doi,
            "Citations": "N/A",  # PubMed API doesn't provide this easily
            "Unique ID": pmid,
            "Link": f"https://pubmed.ncbi.nlm.nih.gov/{pmid}/"
        })
    print(f"  [✔] Found {len(results)} papers on PubMed.")
    return results

def search_scopus(query, max_results=25):
    print(f"\n--- Searching Scopus for: '{query}' ---")
    doc_srch = ElsSearch(query, 'scopus')
    # Fetch results. get_all=True might hit API limits, so we use a reasonable max.
    doc_srch.execute(els_client, get_all=False)
    
    raw_results = doc_srch.results
    if not raw_results:
        print("No results found on Scopus.")
        return []

    # Process and sort by citation count (descending)
    processed_results = []
    for doc in raw_results:
        title = doc.get('dc:title', 'No Title')
        doi = doc.get('prism:doi', '')
        citations = int(doc.get('citedby-count', 0))
        eid = doc.get('eid', '')
        
        processed_results.append({
            "Source": "Scopus",
            "Title": title,
            "DOI": doi,
            "Citations": citations,
            "Unique ID": eid,
            "Link": f"https://www.scopus.com/record/display.uri?eid={eid}&origin=resultslist" if eid else ""
        })

    # Sort to prioritize "good" papers
    processed_results.sort(key=lambda x: x['Citations'], reverse=True)
    
    # Trim to max_results after sorting if needed, but here we return what we got
    # limited by the initial execute call.
    final_results = processed_results[:max_results]
    print(f"  [✔] Found {len(final_results)} papers on Scopus (sorted by citations).")
    return final_results

if __name__ == "__main__":
    print("\n" + "="*50)
    print("🔬 SCIENCE SCRAPER: RESULTS TO CSV")
    print("="*50)
    
    topic = input("\nEnter the research topic (or refined query): ")
    num_papers = input("Max papers to fetch per source (default 25): ")
    num_papers = int(num_papers) if num_papers.strip() else 25
    
    pubmed_results = search_pubmed(topic, max_results=num_papers)
    scopus_results = search_scopus(topic, max_results=num_papers)
    
    all_results = pubmed_results + scopus_results
    
    if all_results:
        df = pd.DataFrame(all_results)
        filename = f"search_results_{re.sub(r'[^a-zA-Z0-9]', '_', topic)[:50]}.csv"
        filepath = os.path.join(DATA_DIR, filename)
        df.to_csv(filepath, index=False)
        print(f"\n[✔] Successfully saved {len(all_results)} papers to: {filepath}")
    else:
        print("\n[!] No results found to save.")
    
    print("\n" + "="*50)
    print("DONE!")
    print("="*50)

