UPDATE employees SET custom_tracking_rule = '{"system": {"visibility": "false"}}' WHERE custom_tracking_rule IS NULL;
