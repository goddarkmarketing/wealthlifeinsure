-- รันใน phpMyAdmin (เลือก database wealthl_cms) ก่อน import ถ้าเจอ error slug ซ้ำ
SET FOREIGN_KEY_CHECKS = 0;
DELETE FROM activity_log;
DELETE FROM leads;
DELETE FROM articles;
DELETE FROM careers;
DELETE FROM insurance_plans;
DELETE FROM testimonials;
DELETE FROM banners;
DELETE FROM home_hero_slides;
DELETE FROM page_sections;
DELETE FROM nav_items;
DELETE FROM footer_links;
DELETE FROM contact_channels;
DELETE FROM seo_meta;
DELETE FROM settings;
SET FOREIGN_KEY_CHECKS = 1;
