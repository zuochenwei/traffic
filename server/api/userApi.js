const express = require('express');
const router = express.Router();
const pool = require('../db'); // 引入数据库连接配置
// 设置要监听的通道名称
const channelName = 'car_changes';
// 在应用程序启动时设置监听器
const setupNotificationListener = async () => {
  const client = await pool.connect();
  // 在通道上添加监听器
  await client.query(`LISTEN ${channelName}`);

  // 处理接收到的通知
  client.on('notification', async () => {
    router.get('/clusterResult', async (req, res) => {
      try {
        // 在通知事件处理程序中执行 SQL 查询
        const queryResult = await pool.query(`
        WITH ClusteredData AS (
          SELECT
            id,
            ST_ClusterDBSCAN(st_transform(geom, 3857), eps := 100, minpoints := 2) OVER () AS cid
          FROM
            car
        )
        SELECT
          COUNT(*) AS num_points_in_cluster
        FROM
          ClusteredData
        WHERE
          cid = (SELECT cid FROM ClusteredData WHERE id = 5834)
      `);
        res.json({ result: queryResult.rows });
      } catch (error) {
        console.error('Error executing SQL query:', error);
      }
    });
  });
  // 在应用程序关闭时释放连接
  process.on('exit', () => {
    client.release();
  });
  // 在捕获到未处理的 Promise 拒绝时退出
  process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
  });
};
// 调用设置监听器的函数
setupNotificationListener();
router.post('/data', async (req, res) => {
  const { param1, param2 } = req.body;
  try {
    // 将 param1 和 param2 合并为一个点
    const pointText = `POINT(${param2} ${param1})`;

    // 在这里执行数据库更新，假设你的数据库表使用 geometry 类型的字段
    const result = await pool.query('UPDATE car SET geom = ST_GeomFromText($1, 4326) where id=5834 RETURNING *', [pointText]);

    res.json(result.rows[0]);
  } catch (error) {
    console.error('更新数据时出错：', error);
    res.status(500).json({ error: '更新数据时出错' });
  }
});
router.get('/route', async (req, res) => {
  try {
    const result = await pool.query(`
    SELECT
    json_build_object(
      'type', 'FeatureCollection',
      'features', json_agg(
        json_build_object(
          'type', 'Feature',
          'geometry', ST_AsGeoJSON(subq.geom)::json,
          'properties', json_build_object(
            'name', '济南市交通图'
          )
        )
      )
    ) AS geojson
  FROM (
   SELECT ST_Union(ST_Transform(geom, 4326)) AS geom
   FROM lixia_feature
   UNION ALL
   SELECT ST_Union(ST_Transform(the_geom, 4326)) AS geom
   FROM lixia_feature_vertices_pgr
  ) AS subq;
  `);
    res.json(result.rows[0].geojson); // 使用正确的属性名称 geojson
  } catch (error) {
    console.error('Error executing query:', error);
    res.status(400).json({ error: 'An error occurred' });
  }
});

router.get('/dijkstra0', async (req, res) => {
  try {
    const result = await pool.query(`
    SELECT
    ST_AsGeoJSON(ST_LineMerge(st_union(st_transform(lixia_feature.geom,4326))))::json AS geojson
FROM
    pgr_dijkstra(
        'SELECT gid AS id,
                source, target,
                cost, reverse_cost,
                name,
                geom
         FROM lixia_feature',
         5834,4073,
        directed := FALSE
    ) AS dijkstra
JOIN lixia_feature ON dijkstra.edge = lixia_feature.gid;
  `);
    res.json(result.rows[0].geojson); // 使用正确的属性名称 geojson
  } catch (error) {
    console.error('Error executing query:', error);
    res.status(500).json({ error: 'An error occurred' });
  }
});

router.get('/dijkstra1', async (req, res) => {
  try {
    const result = await pool.query(`
    SELECT
    ST_AsGeoJSON(ST_LineMerge(st_union(st_transform(lixia_feature.geom, 4326))))::json AS geojson
  FROM
      pgr_dijkstra(
          'SELECT gid AS id,
                  source, target,
                  cost, reverse_cost,
                  name,
                  geom
           FROM lixia_feature',
         4798, 4073,
          directed := true
      ) AS dijkstra
  JOIN lixia_feature ON dijkstra.edge = lixia_feature.gid;
  `);
    res.json(result.rows[0].geojson); // 使用正确的属性名称 geojson
  } catch (error) {
    console.error('Error executing query:', error);
    res.status(500).json({ error: 'An error occurred' });
  }
});
router.get('/allMarker', async (req, res) => {
  try {
    const result = await pool.query(`
    SELECT
      ST_X(geom) AS x,
      ST_Y(geom) AS y
    FROM
      car c ;
  `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error executing query:', error);
    res.status(500).json({ error: 'An error occurred' });
  }
});

module.exports = router;
