-- 减脂计划 D1 建表脚本
-- 用法：npx wrangler d1 execute jianfei --remote --file=schema.sql
CREATE TABLE IF NOT EXISTS state (
  uid TEXT PRIMARY KEY,          -- 用户ID（同一人多设备填同一个）
  shop TEXT NOT NULL DEFAULT '{}',  -- 采购勾选（JSON）
  ck TEXT NOT NULL DEFAULT '{}',    -- 每日打卡（JSON）
  body TEXT NOT NULL DEFAULT '{}',  -- 体重/腰围记录（JSON）
  updated_at INTEGER NOT NULL DEFAULT 0
);
