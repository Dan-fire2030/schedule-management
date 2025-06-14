-- Seed data for default stamps

INSERT INTO public.stamps (name, image_url, category, is_default) VALUES
    ('笑顔', '/stamps/smile.png', 'emotion', true),
    ('泣き顔', '/stamps/cry.png', 'emotion', true),
    ('怒り', '/stamps/angry.png', 'emotion', true),
    ('びっくり', '/stamps/surprised.png', 'emotion', true),
    ('ハート', '/stamps/heart.png', 'emotion', true),
    ('星', '/stamps/star.png', 'emotion', true),
    ('OK', '/stamps/ok.png', 'gesture', true),
    ('NG', '/stamps/ng.png', 'gesture', true),
    ('拍手', '/stamps/clap.png', 'gesture', true),
    ('いいね', '/stamps/thumbsup.png', 'gesture', true),
    ('ありがとう', '/stamps/thanks.png', 'message', true),
    ('おめでとう', '/stamps/congratulations.png', 'message', true),
    ('がんばれ', '/stamps/cheer.png', 'message', true),
    ('お疲れ様', '/stamps/goodjob.png', 'message', true),
    ('了解', '/stamps/roger.png', 'message', true),
    ('キラキラ', '/stamps/sparkle.png', 'effect', true),
    ('虹', '/stamps/rainbow.png', 'effect', true),
    ('雲', '/stamps/cloud.png', 'effect', true),
    ('太陽', '/stamps/sun.png', 'effect', true),
    ('月', '/stamps/moon.png', 'effect', true);