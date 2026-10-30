-- Local-only fictional test installation. These are NOT deployed NFC stickers.
insert into app_private.streets(id,name) values('11111111-1111-4111-8111-111111111111','池袋・開発用');
insert into app_private.areas(street_id,version,polygon)
values('11111111-1111-4111-8111-111111111111',1,
 extensions.st_transform(extensions.st_geomfromtext('POLYGON((139.700 35.725,139.720 35.725,139.720 35.738,139.700 35.738,139.700 35.725))',4326),
 '+proj=tmerc +lat_0=36 +lon_0=139.8333333333333 +k_0=0.9999 +x_0=0 +y_0=0 +ellps=WGS84 +units=m +no_defs'));
insert into app_private.tags(id,street_id,active) values('22222222-2222-4222-8222-222222222222','11111111-1111-4111-8111-111111111111',true);
