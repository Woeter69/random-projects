from playwright.sync_api import sync_playwright
import json
import time

url = "https://sih.gov.in/sih2025PS"

all_data = []
headers = []

with sync_playwright() as pw:
    browser = pw.chromium.launch(headless=True)
    page = browser.new_page()
    
    # Go to first page
    page.goto(url, wait_until="networkidle")
    
    # Wait for the table to appear
    page.wait_for_selector("table")
    page.wait_for_timeout(3000)  # wait for initial page load and JS to initialize
    
    # Grab headers from first page
    headers = [h.inner_text().strip() for h in page.query_selector_all("table thead th")]
    
    # Process all pages (1 to 11)
    for page_num in range(1, 12):  # Pages 1 to 11
        print(f"Scraping page {page_num}...")
        
        # Wait for table to load on current page
        page.wait_for_selector("table")
        page.wait_for_timeout(1500)  # wait for content to render
        
        # Grab all rows from current page
        rows = page.query_selector_all("table tbody tr")
        current_page_data = []
        for row in rows:
            cells = [c.inner_text().strip() for c in row.query_selector_all("td")]
            if cells:
                current_page_data.append(cells)
        
        print(f"Found {len(current_page_data)} rows on page {page_num}")
        all_data.extend(current_page_data)
        
        # If this is not the last page, click the next page button
        if page_num < 11:
            try:
                # Wait for pagination controls to be ready
                page.wait_for_selector(".paginate_button", timeout=5000)
                
                # Find the next page button (button with the page number)
                next_button = None
                pagination_buttons = page.query_selector_all(".paginate_button")
                
                for button in pagination_buttons:
                    button_text = button.inner_text().strip()
                    if button_text == str(page_num + 1):
                        next_button = button
                        break
                
                if next_button:
                    # Scroll into view and click
                    next_button.scroll_into_view_if_needed()
                    next_button.click()
                    
                    # Wait for the table to update (look for loading indicator or changed content)
                    page.wait_for_timeout(2000)
                    
                    # Verify we're on the next page by checking if the active page changed
                    active_page = page.query_selector(".paginate_button.current")
                    if active_page:
                        active_page_num = active_page.inner_text().strip()
                        print(f"Navigated to page {active_page_num}")
                    
                else:
                    print(f"Could not find next page button for page {page_num + 1}")
                    break
                    
            except Exception as e:
                print(f"Error navigating to page {page_num + 1}: {e}")
                break
    
    browser.close()

# Combine headers and all rows
full_data = [headers] + all_data

# Save to JSON
with open("ideas.json", "w", encoding="utf-8") as f:
    json.dump(full_data, f, ensure_ascii=False, indent=2)

print(f"Scraping completed! Found {len(all_data)} rows across all pages.")
