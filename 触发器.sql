--监测函数
CREATE OR REPLACE FUNCTION changes()
  RETURNS TRIGGER AS
$$
BEGIN
  -- 发送 JSON 格式的变化数据到名为 'spatial_table_changes' 的通道
  PERFORM pg_notify('car_changes', row_to_json(NEW)::text);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
--触发器
CREATE TRIGGER after_change
AFTER INSERT OR UPDATE OR DELETE
ON car
FOR EACH ROW
EXECUTE FUNCTION changes();