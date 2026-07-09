/*
  # Customizer explainers (editable) + Get Started cleanup

  1. Adds the admin-editable `explainers` block to the customizer content so the
     "What's this?" helper text on the Design Your Book page can be edited in
     Admin -> Site Content -> Book Customizer. Merged into the existing row.
  2. Removes now-unused Get Started fields (the old self/expert publish-method
     copy) from any saved override so they no longer clutter the CMS editor.

  Idempotent and safe to re-run. No-ops if the rows do not exist.
*/

UPDATE site_content
SET value = value || '{"explainers": {"paper": {"subtitle": "GSM is simply how thick and heavy the paper is.", "body": "GSM (grams per square metre) tells you how thick the paper is. 70–80 GSM is normal for novels — light and easy to hold. 90 GSM feels more premium. 130 GSM art paper is thick and coated, which keeps photos and colours crisp. When in doubt, 70 GSM Natural is the safe, classic choice."}, "cover": {"subtitle": "The look and finish of the outside of your book.", "body": "The cover is what a reader sees first. ''Standard'' is a clean, professional cover at no extra cost. Lamination (matte or gloss) protects it and changes how it feels. Embossing and foil add premium, touchable details — lovely for gifts, but not needed for a simple novel."}, "layout": {"subtitle": "How the words and pictures sit on each page.", "body": "Layout is how your pages are arranged inside. Almost every novel and non-fiction book uses a single column. Two columns suit reference or academic books. Illustrated layouts are for books where pictures matter as much as the words."}, "size": {"subtitle": "The width and height of your finished book (its ''trim size'').", "body": "Trim size is how big the finished book is. Demy is the classic novel size and a safe default. Larger sizes like Double Demy suit photo and coffee-table books. Not sure? Demy or Royal works for most fiction and non-fiction."}, "colour": {"subtitle": "Black & white pages, or full colour throughout.", "body": "This is the colour of the pages inside — not the cover. Black & white is standard and much cheaper, and it''s all a text-only book needs. Choose full colour only if your inside pages have photos, illustrations or colour charts."}, "binding": {"subtitle": "Soft cover (paperback) or hard cover (hardback).", "body": "Binding is how the book is held together. Paperback — also called softback — has a flexible card cover, so it is lighter and more affordable. Hardback (hardcover) has a stiff board cover: more durable and premium, and it lasts for years. Most first books start as paperback."}}}'::jsonb,
    updated_at = now()
WHERE key = 'customizer';

UPDATE site_content
SET value = value - 'methodHeading' - 'expertTitle' - 'expertTagline'
                  - 'expertPoints' - 'selfTitle' - 'selfTagline' - 'selfPoints',
    updated_at = now()
WHERE key = 'getStarted';
