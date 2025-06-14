#!/bin/bash

# Supabaseの型定義を再生成するスクリプト
# 実行前にSupabase CLIがインストールされていることを確認してください

echo "Supabaseの型定義を再生成しています..."

# 現在の型定義ファイルをバックアップ
if [ -f "types/database.types.ts" ]; then
    cp types/database.types.ts types/database.types.ts.backup
    echo "既存の型定義ファイルをバックアップしました"
fi

# 新しい型定義を生成
npx supabase gen types typescript --project-id $NEXT_PUBLIC_SUPABASE_PROJECT_ID > types/database.types.ts

if [ $? -eq 0 ]; then
    echo "型定義の再生成が完了しました"
    echo "types/database.types.ts を確認してください"
else
    echo "型定義の再生成に失敗しました"
    echo "Supabase CLIが正しくインストールされているか、PROJECT_IDが正しく設定されているか確認してください"
fi