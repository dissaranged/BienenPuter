const chai = require('chai');
const { expect } = chai;
const db = require('../redis');
const { toName, toRedisResult } = require('../utils.js');

describe('DB controller', () => {
    const fixtures = {
      realWorldData: [
        {
          time: '2020-05-27,18:04:39',
          model: 'Fineoffset-WH5',
          id: 247,
          temperature_C: 34.8,
          mic: 'CRC',
          key: 'Fineoffset-WH5:247'
        },
        {
          time: '2020-05-27,18:03:51',
          model: 'Fineoffset-WH5',
          id: 247,
          temperature_C: 35.2,
          mic: 'CRC',
          key: 'Fineoffset-WH5:247'
        },
        {
          time: '2020-05-27,18:03:03',
          model: 'Fineoffset-WH5',
          id: 247,
          temperature_C: 34.9,
          mic: 'CRC',
          key: 'Fineoffset-WH5:247'
        },
        {
          time: '2020-05-27,18:02:15',
          model: 'Fineoffset-WH5',
          id: 247,
          temperature_C: 34.8,
          mic: 'CRC',
          key: 'Fineoffset-WH5:247'
        },
        {
          time: '2020-05-27,18:01:27',
          model: 'Fineoffset-WH5',
          id: 247,
          temperature_C: 34.8,
          mic: 'CRC',
          key: 'Fineoffset-WH5:247'
        },
        {
          time: '2020-05-27,18:00:39',
          model: 'Fineoffset-WH5',
          id: 247,
          temperature_C: 34.8,
          mic: 'CRC',
          key: 'Fineoffset-WH5:247'
        },
        {
          time: '2020-05-27,17:59:51',
          model: 'Fineoffset-WH5',
          id: 247,
          temperature_C: 35.3,
          mic: 'CRC',
          key: 'Fineoffset-WH5:247'
        },
        {
          time: '2020-05-27,17:59:03',
          model: 'Fineoffset-WH5',
          id: 247,
          temperature_C: 34.9,
          mic: 'CRC',
          key: 'Fineoffset-WH5:247'
        },
        {
          time: '2020-05-27,17:58:15',
          model: 'Fineoffset-WH5',
          id: 247,
          temperature_C: 34.8,
          mic: 'CRC',
          key: 'Fineoffset-WH5:247'
        },
        {
          time: '2020-05-27,17:57:27',
          model: 'Fineoffset-WH5',
          id: 247,
          temperature_C: 34.9,
          mic: 'CRC',
          key: 'Fineoffset-WH5:247'
        },
        {
          time: '2020-05-27,17:56:39',
          model: 'Fineoffset-WH5',
          id: 247,
          temperature_C: 34.8,
          mic: 'CRC',
          key: 'Fineoffset-WH5:247'
        },
        {
          time: '2020-05-27,17:55:51',
          model: 'Fineoffset-WH5',
          id: 247,
          temperature_C: 34.8,
          mic: 'CRC',
          key: 'Fineoffset-WH5:247'
        },
        {
          time: '2020-05-27,17:55:03',
          model: 'Fineoffset-WH5',
          id: 247,
          temperature_C: 34.8,
          mic: 'CRC',
          key: 'Fineoffset-WH5:247'
        },
        {
          time: '2020-05-27,17:54:15',
          model: 'Fineoffset-WH5',
          id: 247,
          temperature_C: 34.9,
          mic: 'CRC',
          key: 'Fineoffset-WH5:247'
        },
        {
          time: '2020-05-27,17:53:27',
          model: 'Fineoffset-WH5',
          id: 247,
          temperature_C: 34.9,
          mic: 'CRC',
          key: 'Fineoffset-WH5:247'
        },
        {
          time: '2020-05-27,17:52:39',
          model: 'Fineoffset-WH5',
          id: 247,
          temperature_C: 34.9,
          mic: 'CRC',
          key: 'Fineoffset-WH5:247'
        },
        {
          time: '2020-05-27,17:51:51',
          model: 'Fineoffset-WH5',
          id: 247,
          temperature_C: 34.9,
          mic: 'CRC',
          key: 'Fineoffset-WH5:247'
        },
        {
          time: '2020-05-27,17:51:03',
          model: 'Fineoffset-WH5',
          id: 247,
          temperature_C: 35.3,
          mic: 'CRC',
          key: 'Fineoffset-WH5:247'
        },
        {
          time: '2020-05-27,17:50:15',
          model: 'Fineoffset-WH5',
          id: 247,
          temperature_C: 34.9,
          mic: 'CRC',
          key: 'Fineoffset-WH5:247'
        },
        {
          time: '2020-05-27,17:49:27',
          model: 'Fineoffset-WH5',
          id: 247,
          temperature_C: 35.3,
          mic: 'CRC',
          key: 'Fineoffset-WH5:247'
        },
        {
          time: '2020-05-27,17:48:39',
          model: 'Fineoffset-WH5',
          id: 247,
          temperature_C: 34.9,
          mic: 'CRC',
          key: 'Fineoffset-WH5:247'
        },
        {
          time: '2020-05-27,17:47:51',
          model: 'Fineoffset-WH5',
          id: 247,
          temperature_C: 34.9,
          mic: 'CRC',
          key: 'Fineoffset-WH5:247'
        },
        {
          time: '2020-05-27,17:47:03',
          model: 'Fineoffset-WH5',
          id: 247,
          temperature_C: 35.3,
          mic: 'CRC',
          key: 'Fineoffset-WH5:247'
        },
        {
          time: '2020-05-27,17:46:15',
          model: 'Fineoffset-WH5',
          id: 247,
          temperature_C: 35.3,
          mic: 'CRC',
          key: 'Fineoffset-WH5:247'
        },
        {
          time: '2020-05-27,17:45:27',
          model: 'Fineoffset-WH5',
          id: 247,
          temperature_C: 34.9,
          mic: 'CRC',
          key: 'Fineoffset-WH5:247'
        },
        {
          time: '2020-05-27,17:44:39',
          model: 'Fineoffset-WH5',
          id: 247,
          temperature_C: 35.3,
          mic: 'CRC',
          key: 'Fineoffset-WH5:247'
        },
        {
          time: '2020-05-27,17:43:51',
          model: 'Fineoffset-WH5',
          id: 247,
          temperature_C: 34.9,
          mic: 'CRC',
          key: 'Fineoffset-WH5:247'
        },
        {
          time: '2020-05-27,17:43:03',
          model: 'Fineoffset-WH5',
          id: 247,
          temperature_C: 34.9,
          mic: 'CRC',
          key: 'Fineoffset-WH5:247'
        },
        {
          time: '2020-05-27,17:42:15',
          model: 'Fineoffset-WH5',
          id: 247,
          temperature_C: 34.9,
          mic: 'CRC',
          key: 'Fineoffset-WH5:247'
        },
        {
          time: '2020-05-27,17:41:27',
          model: 'Fineoffset-WH5',
          id: 247,
          temperature_C: 35.3,
          mic: 'CRC',
          key: 'Fineoffset-WH5:247'
        },
        {
          time: '2020-05-27,17:40:39',
          model: 'Fineoffset-WH5',
          id: 247,
          temperature_C: 34.9,
          mic: 'CRC',
          key: 'Fineoffset-WH5:247'
        },
        {
          time: '2020-05-27,17:39:51',
          model: 'Fineoffset-WH5',
          id: 247,
          temperature_C: 34.9,
          mic: 'CRC',
          key: 'Fineoffset-WH5:247'
        },
        {
          time: '2020-05-27,17:39:03',
          model: 'Fineoffset-WH5',
          id: 247,
          temperature_C: 35.3,
          mic: 'CRC',
          key: 'Fineoffset-WH5:247'
        },
        {
          time: '2020-05-27,17:38:15',
          model: 'Fineoffset-WH5',
          id: 247,
          temperature_C: 35.3,
          mic: 'CRC',
          key: 'Fineoffset-WH5:247'
        },
        {
          time: '2020-05-27,17:37:27',
          model: 'Fineoffset-WH5',
          id: 247,
          temperature_C: 35.3,
          mic: 'CRC',
          key: 'Fineoffset-WH5:247'
        },
        {
          time: '2020-05-27,17:36:39',
          model: 'Fineoffset-WH5',
          id: 247,
          temperature_C: 35.2,
          mic: 'CRC',
          key: 'Fineoffset-WH5:247'
        },
        {
          time: '2020-05-27,17:35:51',
          model: 'Fineoffset-WH5',
          id: 247,
          temperature_C: 34.9,
          mic: 'CRC',
          key: 'Fineoffset-WH5:247'
        },
        {
          time: '2020-05-27,17:35:03',
          model: 'Fineoffset-WH5',
          id: 247,
          temperature_C: 34.8,
          mic: 'CRC',
          key: 'Fineoffset-WH5:247'
        },
        {
          time: '2020-05-27,17:34:15',
          model: 'Fineoffset-WH5',
          id: 247,
          temperature_C: 34.9,
          mic: 'CRC',
          key: 'Fineoffset-WH5:247'
        },
        {
          time: '2020-05-27,17:33:27',
          model: 'Fineoffset-WH5',
          id: 247,
          temperature_C: 34.8,
          mic: 'CRC',
          key: 'Fineoffset-WH5:247'
        },
        {
          time: '2020-05-27,17:32:39',
          model: 'Fineoffset-WH5',
          id: 247,
          temperature_C: 35.3,
          mic: 'CRC',
          key: 'Fineoffset-WH5:247'
        },
        {
          time: '2020-05-27,17:31:51',
          model: 'Fineoffset-WH5',
          id: 247,
          temperature_C: 34.8,
          mic: 'CRC',
          key: 'Fineoffset-WH5:247'
        },
        {
          time: '2020-05-27,17:31:03',
          model: 'Fineoffset-WH5',
          id: 247,
          temperature_C: 34.9,
          mic: 'CRC',
          key: 'Fineoffset-WH5:247'
        },
        {
          time: '2020-05-27,17:29:27',
          model: 'Fineoffset-WH5',
          id: 247,
          temperature_C: 34.9,
          mic: 'CRC',
          key: 'Fineoffset-WH5:247'
        },
        {
          time: '2020-05-27,17:28:39',
          model: 'Fineoffset-WH5',
          id: 247,
          temperature_C: 34.8,
          mic: 'CRC',
          key: 'Fineoffset-WH5:247'
        },
        {
          time: '2020-05-27,17:27:51',
          model: 'Fineoffset-WH5',
          id: 247,
          temperature_C: 34.8,
          mic: 'CRC',
          key: 'Fineoffset-WH5:247'
        },
        {
          time: '2020-05-27,17:27:03',
          model: 'Fineoffset-WH5',
          id: 247,
          temperature_C: 34.8,
          mic: 'CRC',
          key: 'Fineoffset-WH5:247'
        },
        {
          time: '2020-05-27,17:26:15',
          model: 'Fineoffset-WH5',
          id: 247,
          temperature_C: 34.8,
          mic: 'CRC',
          key: 'Fineoffset-WH5:247'
        },
        {
          time: '2020-05-27,17:25:27',
          model: 'Fineoffset-WH5',
          id: 247,
          temperature_C: 35.2,
          mic: 'CRC',
          key: 'Fineoffset-WH5:247'
        },
        {
          time: '2020-05-27,17:24:39',
          model: 'Fineoffset-WH5',
          id: 247,
          temperature_C: 34.8,
          mic: 'CRC',
          key: 'Fineoffset-WH5:247'
        },
        {
          time: '2020-05-27,17:23:51',
          model: 'Fineoffset-WH5',
          id: 247,
          temperature_C: 34.8,
          mic: 'CRC',
          key: 'Fineoffset-WH5:247'
        },
        {
          time: '2020-05-27,17:23:03',
          model: 'Fineoffset-WH5',
          id: 247,
          temperature_C: 34.8,
          mic: 'CRC',
          key: 'Fineoffset-WH5:247'
        },
        {
          time: '2020-05-27,17:22:15',
          model: 'Fineoffset-WH5',
          id: 247,
          temperature_C: 34.8,
          mic: 'CRC',
          key: 'Fineoffset-WH5:247'
        },
        {
          time: '2020-05-27,17:21:27',
          model: 'Fineoffset-WH5',
          id: 247,
          temperature_C: 34.8,
          mic: 'CRC',
          key: 'Fineoffset-WH5:247'
        },
        {
          time: '2020-05-27,17:20:39',
          model: 'Fineoffset-WH5',
          id: 247,
          temperature_C: 34.8,
          mic: 'CRC',
          key: 'Fineoffset-WH5:247'
        },
        {
          time: '2020-05-27,17:19:51',
          model: 'Fineoffset-WH5',
          id: 247,
          temperature_C: 34.8,
          mic: 'CRC',
          key: 'Fineoffset-WH5:247'
        },
        {
          time: '2020-05-27,17:19:03',
          model: 'Fineoffset-WH5',
          id: 247,
          temperature_C: 34.8,
          mic: 'CRC',
          key: 'Fineoffset-WH5:247'
        },
        {
          time: '2020-05-27,17:18:15',
          model: 'Fineoffset-WH5',
          id: 247,
          temperature_C: 34.8,
          mic: 'CRC',
          key: 'Fineoffset-WH5:247'
        },
        {
          time: '2020-05-27,17:17:27',
          model: 'Fineoffset-WH5',
          id: 247,
          temperature_C: 34.8,
          mic: 'CRC',
          key: 'Fineoffset-WH5:247'
        },
        {
          time: '2020-05-27,17:16:39',
          model: 'Fineoffset-WH5',
          id: 247,
          temperature_C: 34.8,
          mic: 'CRC',
          key: 'Fineoffset-WH5:247'
        },
        {
          time: '2020-05-27,17:15:51',
          model: 'Fineoffset-WH5',
          id: 247,
          temperature_C: 35.2,
          mic: 'CRC',
          key: 'Fineoffset-WH5:247'
        },
        {
          time: '2020-05-27,17:15:03',
          model: 'Fineoffset-WH5',
          id: 247,
          temperature_C: 35.2,
          mic: 'CRC',
          key: 'Fineoffset-WH5:247'
        },
        {
          time: '2020-05-27,17:14:15',
          model: 'Fineoffset-WH5',
          id: 247,
          temperature_C: 34.8,
          mic: 'CRC',
          key: 'Fineoffset-WH5:247'
        },
        {
          time: '2020-05-27,17:13:27',
          model: 'Fineoffset-WH5',
          id: 247,
          temperature_C: 34.8,
          mic: 'CRC',
          key: 'Fineoffset-WH5:247'
        },
        {
          time: '2020-05-27,17:12:39',
          model: 'Fineoffset-WH5',
          id: 247,
          temperature_C: 35.2,
          mic: 'CRC',
          key: 'Fineoffset-WH5:247'
        },
        {
          time: '2020-05-27,17:11:51',
          model: 'Fineoffset-WH5',
          id: 247,
          temperature_C: 34.8,
          mic: 'CRC',
          key: 'Fineoffset-WH5:247'
        },
        {
          time: '2020-05-27,17:11:03',
          model: 'Fineoffset-WH5',
          id: 247,
          temperature_C: 34.8,
          mic: 'CRC',
          key: 'Fineoffset-WH5:247'
        },
        {
          time: '2020-05-27,17:10:15',
          model: 'Fineoffset-WH5',
          id: 247,
          temperature_C: 34.8,
          mic: 'CRC',
          key: 'Fineoffset-WH5:247'
        },
        {
          time: '2020-05-27,17:09:27',
          model: 'Fineoffset-WH5',
          id: 247,
          temperature_C: 34.8,
          mic: 'CRC',
          key: 'Fineoffset-WH5:247'
        },
        {
          time: '2020-05-27,17:08:39',
          model: 'Fineoffset-WH5',
          id: 247,
          temperature_C: 34.8,
          mic: 'CRC',
          key: 'Fineoffset-WH5:247'
        },
        {
          time: '2020-05-27,17:07:51',
          model: 'Fineoffset-WH5',
          id: 247,
          temperature_C: 34.8,
          mic: 'CRC',
          key: 'Fineoffset-WH5:247'
        },
        {
          time: '2020-05-27,17:07:03',
          model: 'Fineoffset-WH5',
          id: 247,
          temperature_C: 35.2,
          mic: 'CRC',
          key: 'Fineoffset-WH5:247'
        },
        {
          time: '2020-05-27,17:06:15',
          model: 'Fineoffset-WH5',
          id: 247,
          temperature_C: 34.8,
          mic: 'CRC',
          key: 'Fineoffset-WH5:247'
        },
        {
          time: '2020-05-27,17:05:27',
          model: 'Fineoffset-WH5',
          id: 247,
          temperature_C: 34.8,
          mic: 'CRC',
          key: 'Fineoffset-WH5:247'
        },
        {
          time: '2020-05-27,17:04:39',
          model: 'Fineoffset-WH5',
          id: 247,
          temperature_C: 34.8,
          mic: 'CRC',
          key: 'Fineoffset-WH5:247'
        },
        {
          time: '2020-05-27,17:03:51',
          model: 'Fineoffset-WH5',
          id: 247,
          temperature_C: 34.8,
          mic: 'CRC',
          key: 'Fineoffset-WH5:247'
        },
        {
          time: '2020-05-27,17:03:03',
          model: 'Fineoffset-WH5',
          id: 247,
          temperature_C: 34.8,
          mic: 'CRC',
          key: 'Fineoffset-WH5:247'
        },
        {
          time: '2020-05-27,17:02:15',
          model: 'Fineoffset-WH5',
          id: 247,
          temperature_C: 34.8,
          mic: 'CRC',
          key: 'Fineoffset-WH5:247'
        },
        {
          time: '2020-05-27,17:01:27',
          model: 'Fineoffset-WH5',
          id: 247,
          temperature_C: 34.8,
          mic: 'CRC',
          key: 'Fineoffset-WH5:247'
        },
        {
          time: '2020-05-27,17:00:39',
          model: 'Fineoffset-WH5',
          id: 247,
          temperature_C: 35.2,
          mic: 'CRC',
          key: 'Fineoffset-WH5:247'
        },
        {
          time: '2020-05-27,16:59:51',
          model: 'Fineoffset-WH5',
          id: 247,
          temperature_C: 34.8,
          mic: 'CRC',
          key: 'Fineoffset-WH5:247'
        },
        {
          time: '2020-05-27,16:59:03',
          model: 'Fineoffset-WH5',
          id: 247,
          temperature_C: 34.9,
          mic: 'CRC',
          key: 'Fineoffset-WH5:247'
        },
        {
          time: '2020-05-27,16:58:15',
          model: 'Fineoffset-WH5',
          id: 247,
          temperature_C: 35.2,
          mic: 'CRC',
          key: 'Fineoffset-WH5:247'
        },
        {
          time: '2020-05-27,16:57:27',
          model: 'Fineoffset-WH5',
          id: 247,
          temperature_C: 34.9,
          mic: 'CRC',
          key: 'Fineoffset-WH5:247'
        },
        {
          time: '2020-05-27,16:56:39',
          model: 'Fineoffset-WH5',
          id: 247,
          temperature_C: 34.8,
          mic: 'CRC',
          key: 'Fineoffset-WH5:247'
        },
        {
          time: '2020-05-27,16:55:51',
          model: 'Fineoffset-WH5',
          id: 247,
          temperature_C: 34.8,
          mic: 'CRC',
          key: 'Fineoffset-WH5:247'
        },
        {
          time: '2020-05-27,16:55:03',
          model: 'Fineoffset-WH5',
          id: 247,
          temperature_C: 34.8,
          mic: 'CRC',
          key: 'Fineoffset-WH5:247'
        },
        {
          time: '2020-05-27,16:54:15',
          model: 'Fineoffset-WH5',
          id: 247,
          temperature_C: 35.2,
          mic: 'CRC',
          key: 'Fineoffset-WH5:247'
        },
        {
          time: '2020-05-27,16:53:27',
          model: 'Fineoffset-WH5',
          id: 247,
          temperature_C: 34.9,
          mic: 'CRC',
          key: 'Fineoffset-WH5:247'
        },
        {
          time: '2020-05-27,16:52:39',
          model: 'Fineoffset-WH5',
          id: 247,
          temperature_C: 34.9,
          mic: 'CRC',
          key: 'Fineoffset-WH5:247'
        },
        {
          time: '2020-05-27,16:51:51',
          model: 'Fineoffset-WH5',
          id: 247,
          temperature_C: 34.9,
          mic: 'CRC',
          key: 'Fineoffset-WH5:247'
        },
        {
          time: '2020-05-27,16:51:03',
          model: 'Fineoffset-WH5',
          id: 247,
          temperature_C: 34.8,
          mic: 'CRC',
          key: 'Fineoffset-WH5:247'
        },
        {
          time: '2020-05-27,16:50:15',
          model: 'Fineoffset-WH5',
          id: 247,
          temperature_C: 34.8,
          mic: 'CRC',
          key: 'Fineoffset-WH5:247'
        },
        {
          time: '2020-05-27,16:49:27',
          model: 'Fineoffset-WH5',
          id: 247,
          temperature_C: 34.8,
          mic: 'CRC',
          key: 'Fineoffset-WH5:247'
        },
        {
          time: '2020-05-27,16:48:39',
          model: 'Fineoffset-WH5',
          id: 247,
          temperature_C: 35.2,
          mic: 'CRC',
          key: 'Fineoffset-WH5:247'
        },
        {
          time: '2020-05-27,16:47:51',
          model: 'Fineoffset-WH5',
          id: 247,
          temperature_C: 34.9,
          mic: 'CRC',
          key: 'Fineoffset-WH5:247'
        },
        {
          time: '2020-05-27,16:47:03',
          model: 'Fineoffset-WH5',
          id: 247,
          temperature_C: 35.3,
          mic: 'CRC',
          key: 'Fineoffset-WH5:247'
        },
        {
          time: '2020-05-27,16:46:15',
          model: 'Fineoffset-WH5',
          id: 247,
          temperature_C: 34.9,
          mic: 'CRC',
          key: 'Fineoffset-WH5:247'
        },
        {
          time: '2020-05-27,16:45:27',
          model: 'Fineoffset-WH5',
          id: 247,
          temperature_C: 34.9,
          mic: 'CRC',
          key: 'Fineoffset-WH5:247'
        },
        {
          time: '2020-05-27,16:44:39',
          model: 'Fineoffset-WH5',
          id: 247,
          temperature_C: 35.3,
          mic: 'CRC',
          key: 'Fineoffset-WH5:247'
        }
      ],

      'Model1:123@1': {
        latest: {
          time: '2020-05-08,15:14:25',
          brand: 'OS',
          model: 'Model1',
          id: 123,
          channel: 1,
          battery_ok: 1,
          temperature_C: 16.6,
          key: 'Model1:123@1'
        },
        subscribed: false,
        alias: 'Temp1',
        color: '005500',
        key: 'Model1:123@1',
      },
      subscribedDevice: {
        latest: {
          time: '2020-05-08,15:14:25',
          brand: 'OS',
          model: 'Model1',
          id: 123,
          channel: 3,
          battery_ok: 1,
          temperature_C: 16.6,
          key: 'Model1:123@3'
        },
        subscribed: true,
        alias: 'Temp2',
        color: '550000',
        key: 'Model1:123@3'
      },
      reading: {
        time: '2020-05-06,16:25:46',
        brand: 'OS',
        model: 'Model1',
        id: 123,
        channel: 2,
        battery_ok: 1,
        temperature_C: 16.6,
        key: 'Model1:123@2'
      }
    };

  let redis;
  before(async () => {
    // setup db
    redis = db.setup({ db: 1 });
    expect(await redis.keys('*')).to.have.length(0);
  });

  describe('storeReading', () => {
    beforeEach(async () => {
      await db.hsetObject(toName('Model1:123@1'), fixtures['Model1:123@1']);
      await db.hsetObject(toName(fixtures.subscribedDevice.latest.key), fixtures.subscribedDevice);
    });

    it('creates a new device enrty when storing a reading of an unknown device', async () => {
      const { reading } = fixtures;
      const { key } = reading;
      expect( await redis.exists(toName(key)) ).to.equal(0);
      await db.storeReading(reading);
      expect(await redis.exists(toName(key))).to.equal(1);
      const result = await redis.hgetall(toName(key));
      expect(result).to.deep.equal({ latest: JSON.stringify(reading), key });
      const readings = await redis.zscan(`readings.${key}`, 0);
      expect(readings).to.deep.equal(['0', []]);
    });

    it('saves new readings to latest', async () => {
      const key = 'Model1:123@1';
      const item = fixtures[key];
      const newReading = {
        ...item.latest,
        time: fixtures.reading.time,
        temperature_C: 15.3
      };
      expect( await redis.hgetall(toName(key)) ).to.deep.equal( toRedisResult(item) );
      await db.storeReading(newReading);
      expect( await redis.exists(toName(key)) ).to.equal(1);
      const result = await redis.hgetall(toName(key));
      expect(result).to.deep.equal(toRedisResult({ ...item, latest: newReading }));
      const readings = await redis.zscan(`reading.${key}`, 0);
      expect(readings).to.deep.equal(['0', []]);
    });

    it('collects readings when subscribed to an deviec', async () => {
      const item = fixtures.subscribedDevice;
      const { key } = item.latest;
      const newReading = {
        ...item.latest,
        time: fixtures.reading.time,
        temperature_C: 15.3
      };
      await db.storeReading(newReading);
      const readings = await redis.zscan(toName(key, 'readings'), 0);
      expect(readings).to.deep.equal(['0', [JSON.stringify(newReading), JSON.stringify(Date.parse(newReading.time) / 1000)]]);
      const deviceEntry = await redis.hgetall(toName(key));
      expect(deviceEntry).to.deep.equal(toRedisResult({
        ...item, latest: newReading
      }));
    });
  });

  describe('createIndex', () => {
    const latestExample = {
      time: '2020-05-08,15:14:25',
      brand: 'OS',
      model: 'Model1',
      id: 123,
      channel: 1,
      battery_ok: 1,
      temperature_C: 16.6,
      key: 'Model1:123@1'
    };
    const now = 1590232971;

    beforeEach(async () => {
      const commands = [//val|+t
        [10,   0 ],
        [20,  60 ],
        [40,  70 ],
        [40, 360 ],
      ].reduce( (acc, [val, t]) => ([
        ...acc,
        now+t,
        JSON.stringify({
          ...latestExample,
          time: new Date((now+t)*1000),
          temperature_C: val,
          humidity: val*2,
        })
      ]), []);
      await redis.zadd(toName(latestExample.key, 'readings'), commands);
    });

    it('creates 6m samples correctly', async () => {
      await db.createIndex(latestExample.key, {since: now, until: now+360});
      const {data} = await db.getReadings({device: latestExample.key, type: '6m'});
      expect(data).to.deep.equal([{
        temperature_C: {min: 10, max: 40, average: (10*30+20*35+40*295)/360},
        humidity: {min: 20, max: 80, average: 2*(10*30+20*35+40*295)/360},
        time: (now+180)*1000
      }]);
    });

    it('handles real world data', async () => {
      const key = 'Fineoffset-WH5:247';
      Promise.all(fixtures.realWorldData.map( sample => db.redis.zadd(
        toName(key, 'readings'),
        Math.floor(new Date(sample.time).valueOf()/1000),
        JSON.stringify(sample)
      )));

      await db.createIndex(key, {
        since: Math.floor(new Date('2020-05-27,16:44:39').valueOf()/1000),
        until: Math.floor(new Date('2020-05-27,18:04:39').valueOf()/1000),
      });
      const {data} = await db.getReadings({device: key, type: '6m'});
      expect(data).to.have.length(14);
      expect(data[0]).to.deep.equal({temperature_C: {min: 34.8, max: 35.2, average: 34.86666666666666}, time: 1590595539000});
    });

  });
});
