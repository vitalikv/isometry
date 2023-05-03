import * as THREE from 'three';

export class LoaderModel {
  loader;
  offset = new THREE.Vector3();
  meshes = [];

  constructor({ scene, name }) {
    this.scene = scene;
    this.loader = new THREE.ObjectLoader();
  }

  loaderObj(name) {
    this.loader.load(
      'img/' + name + '.json',

      (obj) => {
        if (this.offset.length() === 0) {
          this.offset = this.getBoundObject_1({ obj });
        }

        obj.position.add(this.offset);

        if (name === '000-MR1_PIPE01' || name === '0019.005-TH_02.osf') {
          //const type = 1; // можно выделить все объекты
          const type = 2; // можно выделить объекты из списка
          //const type = 3; // можно выделить объекты которых нету в списке

          obj.traverse((mesh) => {
            if (mesh instanceof THREE.Mesh) {
              mesh.material = mesh.material.clone();

              const list = this.listSelectObjs();

              let add = false;
              for (let i = 0; i < list.length; i++) {
                if (mesh.uuid === list[i]) {
                  add = true;
                  break;
                }
              }

              if (type === 1) meshes.push(mesh);
              if (type === 2) if (add) this.meshes.push(mesh);
              if (type === 3) {
                if (!add) this.meshes.push(mesh);
                else mesh.material.color.set(0xff0000);
              }
            }
          });
        } else {
          this.meshes.push(obj);
        }

        this.scene.add(obj);
      }
    );
  }

  getBoundObject_1({ obj }) {
    let arr = [];

    obj.updateMatrixWorld(true);

    obj.traverse(function (child) {
      if (child instanceof THREE.Mesh) {
        arr[arr.length] = child;
      }
    });

    let v = [];

    for (let i = 0; i < arr.length; i++) {
      arr[i].geometry.computeBoundingBox();
      arr[i].geometry.computeBoundingSphere();

      let bound = arr[i].geometry.boundingBox;

      v[v.length] = new THREE.Vector3(bound.min.x, bound.min.y, bound.max.z).applyMatrix4(arr[i].matrixWorld);
      v[v.length] = new THREE.Vector3(bound.max.x, bound.min.y, bound.max.z).applyMatrix4(arr[i].matrixWorld);
      v[v.length] = new THREE.Vector3(bound.min.x, bound.min.y, bound.min.z).applyMatrix4(arr[i].matrixWorld);
      v[v.length] = new THREE.Vector3(bound.max.x, bound.min.y, bound.min.z).applyMatrix4(arr[i].matrixWorld);

      v[v.length] = new THREE.Vector3(bound.min.x, bound.max.y, bound.max.z).applyMatrix4(arr[i].matrixWorld);
      v[v.length] = new THREE.Vector3(bound.max.x, bound.max.y, bound.max.z).applyMatrix4(arr[i].matrixWorld);
      v[v.length] = new THREE.Vector3(bound.min.x, bound.max.y, bound.min.z).applyMatrix4(arr[i].matrixWorld);
      v[v.length] = new THREE.Vector3(bound.max.x, bound.max.y, bound.min.z).applyMatrix4(arr[i].matrixWorld);
    }

    let bound = { min: { x: Infinity, y: Infinity, z: Infinity }, max: { x: -Infinity, y: -Infinity, z: -Infinity } };

    for (let i = 0; i < v.length; i++) {
      if (v[i].x < bound.min.x) {
        bound.min.x = v[i].x;
      }
      if (v[i].x > bound.max.x) {
        bound.max.x = v[i].x;
      }
      if (v[i].y < bound.min.y) {
        bound.min.y = v[i].y;
      }
      if (v[i].y > bound.max.y) {
        bound.max.y = v[i].y;
      }
      if (v[i].z < bound.min.z) {
        bound.min.z = v[i].z;
      }
      if (v[i].z > bound.max.z) {
        bound.max.z = v[i].z;
      }
    }

    let offset = new THREE.Vector3(
      -((bound.max.x - bound.min.x) / 2 + bound.min.x),
      -((bound.max.y - bound.min.y) / 2 + bound.min.y),
      -((bound.max.z - bound.min.z) / 2 + bound.min.z)
    );

    return offset;
  }

  listSelectObjs() {
    let list = [
      'c8dd8578-4584-4cbe-89a4-55c2ab3180a9',
      '75cf4d5b-3c04-43fc-927c-6e8eec4aa604',
      '086c730d-7434-433f-84bc-b830e7146f7b',
      '0e2feb88-a95e-4d55-8e70-dcba6fe9c858',
      '01dbabc4-5d58-411f-9408-d9f1fa92e093',
      'ac59c9bd-8edb-49f6-8971-258e8cd6b43e',
      'd625deb8-2cf2-4033-ad18-bcdc237098fd',
      '5b098cf9-48a4-4605-9536-aad7442624f0',
      '6551fc32-a5c0-495e-90b3-25c4bf813c7a',
      '7de3ec3c-3105-479e-9e88-85ed8c925735',
      '44e8df7c-2560-418e-b236-d4cb63295af7',
      '96445ce0-f4e5-4148-9209-f601bdc30d96',
      '99e148cb-2590-430e-9ddc-deca90a8f88c',
      'd3b4ad7a-12b3-4390-ac34-f7fc9fe4b823',
      '69e76dfb-d41b-48f2-8550-f92bf35a25a0',
      '74aaa1ac-1a66-4651-8539-4b7f91575de7',
      '7d1add9a-0ecf-4553-b6a2-43f24d66be87',
      'ab10562a-e9ca-4db9-a570-86e09add9f94',
      '2b87c557-d077-49d2-9a50-f688537d54f0',
      'd1c558f6-0239-4663-9789-845981251bfb',
      '2183c8b5-0772-4b6e-aa09-b72efe2757bf',
      '79b18808-0179-49f4-b029-5864fcddff6e',
      '8a0c5017-3739-461b-9595-4fc6b2f40f84',
      '9572b527-b709-4e1e-93e2-3650b9cd8a92',
      '32dff6b5-4613-4467-9736-93fe2f3a1a8e',
      '04ac1803-99cf-4ebf-a652-eb8f6744ea03',
      '74ae18bd-41ad-4fc5-b834-3004afeac796',
      'e77bfaba-2634-4caf-b552-146f856ac382',
      '10d36609-100c-48b3-b8ca-3ba683547c54',
      '285ec00f-42f1-4fb8-ad39-ee613d0c0cc6',
      'd9eba22b-d68e-4259-b007-59cacd6bf575',
      '0420f06f-0f9f-4629-af7d-f0fe92d0a89e',
      '885bf181-c0ff-4a38-9d55-d27660ab3dfe',
      'de0d4625-53da-4cd1-8a18-fcb1b6bed63b',
      '79e2e039-fd49-488d-9118-cbfd3dd5a7ef',
      '337a77bf-f280-4ecd-acf8-1b24fbe59814',
      'ed75f660-1851-483d-a6b7-b0aeb743f048',
      '43de7003-9449-443f-b90e-694065ec344d',
      'af70ebf9-002e-4ab4-b8ec-7d51e5c4cc96',
      '5e497923-124f-4dac-b20d-0936f3738263',
      'bf7a3ccf-ac12-418b-886c-bc207f460beb',
      '975e1c41-d979-48f1-97fc-f2dcfa129b50',
      '770f34d1-ea4f-4758-af3b-297ec10c3c46',
      '6c70140b-9b7b-4f01-84ed-baa881a18769',
      'ed9b7019-096e-47ce-b0dc-87ef96787f6a',
      '2506bebc-4cb7-41a5-92b7-ecb093ccce5c',
      '6e03e1e6-2cac-48fd-ada5-be8c20c967e1',
      '5f0275e0-b968-49c3-8fd1-04abb89507b4',
      '4a91d252-f58a-4aca-994f-bc7565537c0d',
      '70983eb6-33cf-47bc-9586-ac603fdff47c',
      'c10f1e9a-423d-4524-8057-e95e8b55b6bf',
      'd7140bc9-db12-496f-8c2b-5960f1174ef6',
      'eb66f9d9-d362-432c-b734-25ae463ca9a1',
      'bea8439a-43e0-4b16-852d-4c6e1f386477',
      '739db89e-d369-475e-83e2-4282dbbb5d31',
      'b4dc36b5-2e7d-4040-ad5b-6723242d01f1',
      'c8a742a1-c425-4bca-a651-a89869af39e6',
      'fbff9b10-61da-44bf-9feb-a20018772f33',
      '9c3f6024-743b-4ae3-809e-8ce7e1a6e275',
      '8781c4df-93b7-4d6d-b851-5f0e745e9f59',
      'e4e63c49-afba-404a-b76d-b8df26d10c06',
      'ef7a015c-1113-48db-b07a-ce9f705a2f7c',
      '2a0708c4-4da6-4965-9eb0-36aedae43ca6',
      '8fdb1cb7-5344-4c5e-ab30-b99f8d982d86',
      'b41b0d90-0464-4f98-b121-a191ac1341df',
      '4ae0bb6f-ca3b-4a46-87fe-264a4ad84429',
      'b4e00ad1-0264-4f10-aff1-30361de540a8',
      '4347840c-5b38-4b47-9ef9-7ba4a8e00bb7',
      'f84edd57-dbef-465b-8370-bc6d60ad6986',
      '8311eb8d-3576-4106-b42b-bc51eafcd622',
      '897b731b-1c3a-400d-8837-04f2f5894d05',
      '6cfd5095-def9-4809-b028-5084f32628f7',
      '5f82e188-dabb-4eba-829d-e5f3663ba8fa',
      '735ee1be-4ed4-4b4d-9d75-c71d1870325c',
      '20fceff0-372e-4dd8-9c45-70c630fc7b06',
      'eb5d003e-9080-46b1-8218-06ce868e1c3c',
      '3f257859-5f5b-4fa6-af24-c38824c21c3c',
      'e733a9c1-b4ac-4de1-bdf6-f27fd2cd3777',
      'fbb442d3-9429-4cf1-9995-528ffa265003',
      '4769d773-e16e-4a7c-9dad-f6c131000aa4',
      '91e5b1a3-2ffd-4fd5-bdda-f869eff8b1c4',
      '180d5003-9ff7-4a7d-a404-9e4cdeac4b5e',
      '4a55a3ba-8da4-4a21-88ed-7e3f4af2db3b',
      '93c9bee8-a7f4-47eb-9b6b-bd8e5868e949',
      '6aaa8836-4754-4ba8-89d6-9d9b44676791',
      '32565b71-b882-4255-bcc3-cbfa05c1062d',
      'c345e041-c209-4d0c-9b56-140032e1cd95',
      'e275958a-16eb-4dfb-a06f-e6e1a49c0a48',
      '5b7f4e86-baa9-4233-97a2-2ff930033552',
      '832d723c-9e2f-464f-97fa-0c58bbce074a',
      'a289d9b8-4384-4674-8b51-6f6a39101702',
      'e3fc9262-3438-4eb8-8d09-ce1c2f5eadb3',
      '08d33c3e-f119-4b14-96e7-ee81464c08b6',
      'b1d9a185-7f12-4537-89c8-07b7d3d4d4ea',
      '837a16d9-14f5-47b4-b776-a216649bda10',
      '23b8d36a-6275-469e-906f-2d7cdda8b08c',
      'c257df7d-61bd-418d-8eca-5eb7a4664a68',
      'ef974c57-f943-48a5-9033-275a1a2498f2',
      'ff0a0062-f363-46de-b0c1-eb0460de60ea',
      '4e96d7f0-54d5-416e-85cb-7b7c7b80ef2f',
      'c07ec64d-e5c1-4df7-b016-b5a2411beff4',
      '606f6cce-170f-4bc8-b27d-11ff6527a084',
      '8498cb7c-84fe-40d1-b866-04d19d2d9acf',
      '51f081b3-4371-4833-be5f-a03f6cb4db3a',
      'b7497c95-2648-4ae6-9f5b-f4dce9103e4e',
      '44ec8075-2487-4a22-8290-677639eef548',
      'd6d793a8-6f90-4cc5-a0fa-ac3dde944c97',
      '70981b71-b99d-4747-97e8-a65d227ac60b',
      '5fdf603b-8c66-48a3-896c-d9fd8bc3ad9b',
      '880fcd08-2f41-4905-bcbd-ccd3a1fb8e06',
      '3598414d-4627-4d50-b232-e564e19cf144',
      '6dc1742b-1530-42e9-adf2-20948218d83c',
      'f4ea0464-8bf5-4992-86d8-1295ec020371',
      '388c2823-031b-4929-b56a-4d517c4ead46',
      'a521efc8-2ddf-4010-80d8-ced88d982f8f',
      'c79b224e-a216-4cc2-bdb6-71922bee7445',
      '565226dc-0992-4e49-8fdf-48125d3a5d75',
      '542d4f54-2528-4b27-b64b-04e885ef2c0d',
      'df3b818b-92c6-4eb4-ac45-1fe90efc065a',
      'b4154e37-4b4a-4d4a-865e-bc1e092c1d50',
      '42a81380-6ad6-4f45-98bb-4509b425c496',
      'bc047861-fdc8-4c77-b4ea-cf2c36966740',
      '42458c45-2ee8-428d-a130-f3b9a5b785e7',
      'cb0c9a44-e380-4f5f-a85a-584f11432198',
      '8b2a12f0-737e-41d1-a79a-dd7508206aa0',
      '3991a1e6-88a7-4572-b65b-2f6fd7ca1176',
      'ac7d5b3a-8e8c-48e4-b217-544721e43cb2',
      '15a1130b-f3c7-4a52-b5f1-87a2b2073c29',
      'faef8fad-7abf-4324-bf69-f9369188d55a',
      '36f5b30e-3799-45f9-ae95-fd6049e71c3d',
      'f1fed85a-4623-4977-bb1c-1c306635d6f4',
      '333ef1fe-586d-48bf-8970-f64436937860',
      '8dfb4dd0-fa45-4325-9b06-4efb4d0653f9',
      '42596dc5-54d3-465c-9cb3-011765bb74f8',
      'ab974204-68ad-4996-a20e-a0c3295b66c1',
      '5e24d3ab-ef1c-43ae-ae77-b3d293e321b6',
      '5ef5884b-67f1-49ef-95b2-3aaeeaffddb4',
      '806f72df-885a-4896-82ef-e2a8929a5677',
      '56105dd8-572c-4fde-a70b-3a92428394ed',
      '58445ddf-f8c5-4a53-a72e-dad86e8bfc3c',
      '5dfeaf61-6acb-44e7-991a-f2eb4387d5ae',
      'b4a80aab-15f1-40f8-affa-f404ad21582a',
      '46ad911a-b89b-40f8-bc3b-777c9fcf2a4b',
      '6568f7bd-2877-4254-bf2b-42e968b69d89',
      '0627d450-ee7c-4230-8880-4b4449441050',
      'da2abcc2-f463-4a68-aac1-2c5f5203459e',
      'e2b25238-4530-411f-83f3-e2c5b5a01381',
      'ee10575f-5348-41f7-a56b-a51bf969f910',
      '4a7a8877-8e7c-4344-bffc-4f7381f07b77',
      '90de6361-3902-441a-beae-a4645a4596d3',
      '79a536ff-ff3a-45df-be8e-3c5ff907a17d',
      '449f4311-d009-46e6-9292-4ebe36c3a9c3',
      '65e4dd21-c06a-4543-8666-d341bb09ccdc',
      '0de69a75-6329-4462-be6e-7648981784e6',
      '184721d1-882f-4e3a-8445-386994383b19',
      'ac42df5e-c96d-4356-b10a-81511ec09c08',
      'b25c6891-5d9c-47f3-96ad-5bc989986a7e',
      'd3f544c0-9b90-406a-b4c6-b090ee08898d',
      '67307100-ca07-4254-addb-d5a2322dc96f',
      'b72c8bad-ff34-4a3f-afc2-66ea230a86c7',
      '0939b8b7-18bc-40e7-899f-6af5f20996eb',
      '60b451eb-863f-4267-be4e-82d3e5a2dec7',
      'a7c19b03-c11d-42a8-8d37-416cceaa07a3',
      '5234c8c4-9c0a-49ac-b408-fe722790d8ca',
      'cb1e994c-f33e-4eba-b364-d3ac9478ee5c',
      '44873388-0bcd-4ea8-a993-40f588b3ba99',
      '8bb085a1-db6c-42fb-9f77-fdca399c522d',
      '093062d7-5d29-4f6c-8014-429b8d16e2b1',
      '4b682def-e3f3-4f35-8908-9d9fab8214fc',
      '14493f21-88e6-4733-ae53-94c5018490f7',
      '0db44f02-334d-401e-9ead-8bf339c10571',
      '6b56c915-a21a-4e5c-8981-f0acf687d80b',
      '35ba0a90-145e-4c44-ae1d-6e039e536888',
      'aaa9fd18-09e6-409c-8575-c66705a4a2f8',
      '5837fe30-2711-46d1-a7a3-60327c69155d',
      'c3e7ba57-3a89-4738-a9ce-133bc5f2e361',
      '20be5129-74ef-44d9-9c4f-085e7baac1b9',
      'f7f32aab-455c-4d01-b2dc-81d39b13581f',
      '568e24c9-a1fe-49b7-8302-151f264b833b',
      'c8b37441-69a8-4839-89f2-c97d351569df',
      'd03453ce-0dab-495b-a793-2b66a4a8326f',
      '3157ce39-3d89-46b6-8558-908db1b2ec63',
      '30c93649-34bd-4b26-823f-708e981647e4',
      '49202fe3-1c1f-4347-b5ba-ddbe7a4fb744',
      'a512dee5-8a69-48d8-8672-e31e807eb386',
      '64b5281c-3752-44a9-81a9-af157c0ab882',
      '33106e04-f0e5-4eff-ac82-9dedf21377eb',
      '4f566499-bee8-402c-8db8-03b2eef8fbe9',
      '3a1d0ea7-1b88-4680-87ef-f3831b0fee8e',
      '2c529cd6-cc0f-42b8-8195-b3cfd111b69e',
      '8b0001c7-8546-4872-9c25-177b8312bc48',
      '3c4b3cbf-bbe6-46f1-938d-c8c4bf27c4ea',
      '96b1511a-dd2f-4680-9347-a6331307f439',
      '87c214b6-0a2b-40f2-a769-36d06bdf7394',
      '76da53c4-ca9e-4427-804d-4e23af98125c',
      '32ef2a7b-8663-4b2b-9f34-e41f4ce7b292',
      'd0dd0717-8f71-4e2a-8260-613c5ff5f2b9',
      '69ca2370-0dc3-43c2-8367-92333ea1396e',
      '7c0fa602-f81b-499d-8c88-d2f970ce235c',
      'e803f2d3-5048-413b-a084-35f8d71cdaa8',
      '93bdf8b1-71e5-4b90-a86f-d6f506fd9ee6',
      '5aead79e-31e9-4394-a82c-7d5e1cea92c4',
      '081acaf5-2d7b-46c2-b2ea-202e954405a7',
      'b4affff4-07cb-4ff1-83c9-46c415c540be',
      '2c678419-c680-4696-b59f-0335f432acd9',
      '7804757d-76d8-44b2-a751-495b9b5b9224',
      '1279d285-8c5d-41e5-b1c6-cc78f701b366',
      '22fdf5c8-bdd5-469e-ae3c-7021dd5d4f51',
      '5ddc676d-28b4-4a8a-b3d3-d61e78364ea8',
      '64d9aebe-1bef-4cc8-8713-a5b22a1cd66f',
      '7b0f5341-265c-4e42-b405-bcb90809527f',
      '8f108555-6790-4380-b6ac-c08ea41e225c',
      'f2948ad6-c1ac-4403-a9cf-c26006da2560',
      '746db48d-d3a3-4068-93c1-910fbf042c38',
      '1803aa1c-53d8-48bc-9f9e-978fa3e4ae62',
      'fe220782-16c1-4e47-b353-101caa61488e',
      '150c364e-97a3-4896-b1ee-aca0215c0926',
      '5d53e0ec-b2d8-494a-8d65-0761c9eb0ecf',
      'a119f71a-9daa-4d6a-878f-239421deedef',
      'f10724fa-4084-4f21-b28b-4642fe41729c',
      '9b3dbdd9-ccd5-4fad-a9fd-1da129497698',
      'e01d006e-0844-48e8-b662-0cdd073f08b6',
      '6d651874-88b8-4407-96bd-50b8ed2b6348',
      '66fa9877-ceac-4e62-9bfb-53fb908e4dd1',
      '008f947a-dab3-4974-97c6-2f45724e1208',
      '8c734dd2-f2b1-466b-a5d5-4c0b0e4f39e7',
      '0c79ad51-68e0-4081-997c-37fda49e9a2e',
      '60be66cf-ebc4-48b8-9415-939db794ea79',
      '88772eba-758b-4ec6-a0e7-e5ac7d79a2d5',
      'a3f29acf-f5f7-4ce1-a283-12ff509d55b6',
      'd4060e0f-4421-4c0d-8094-9502dd34f461',
      'cb2f978b-b5be-4a63-9eec-eda71d65bf4a',
      'd7d71220-ba2b-45a5-b510-dafec5d5e0b9',
      'f73ab1e8-4b4b-486c-bf94-35bbe6831c24',
      'd3d2aefe-6b0e-4a9f-b16b-14f80965e9e2',
      '8eb9d6fe-f56f-4037-b907-2635d8e784ee',
      '37403b4e-cfc6-4706-b6a9-09b3bbbe88eb',
      '726b6ffe-d31d-4a71-afc0-76b72e633351',
      '6f4c7178-1f6a-440a-a650-9b21568d0e80',
      '58dbd352-f85a-4eea-b2c0-b3a1e4b7b1b9',
      '6b7a3d32-e971-497a-b6d2-7833e7abbdbd',
      '36e76897-3cbe-4e11-b6f3-e15d906c8204',
      '6e3a858d-b2fe-4aba-8ec1-75900826b92e',
      '4a7a1984-bf84-4817-bf5a-328c9ef418d4',
      'f1eb5c66-e2d1-4fb4-b49c-d888c723acd8',
      '0de17fea-840d-4e83-8424-8e2b29e838bd',
      '24ea7d67-0353-450a-89c3-2ee862b056d3',
      '64b0799e-6541-4aeb-9ffd-f3850648676d',
      '2867ee6a-9707-406f-aadf-34d0cbe33b5a',
      'd39bb57e-d433-403d-b0d0-df3b88a4ad42',
      '74f71336-60f8-4ab3-916e-788c250ce02d',
      'eecc2cda-beca-4fe7-ac44-b20bf395c415',
      '3952a0a6-5400-475b-8f41-b97503e57aaf',
      '75930e36-4a23-40f2-b71b-673fbd5f1613',
      '7afc32d6-2974-46a0-90e5-b5fe2faa2c49',
      '8d2fd74f-6b3f-449c-8b38-56b5b33bb6f3',
      '5618d18f-d88e-4c6c-98aa-328f4a3ab0c6',
      '41b73c0b-21e2-4aa5-a578-c7dd448e775a',
      '809a1052-93bb-41ab-9402-b5b3ea26e56d',
      '539b136f-bb06-465e-8e35-c1f6d95f4644',
      '7abe1547-a443-4e29-98c3-5be28c4e278d',
      '1eb071d6-67a4-4c51-b183-5b3f9fface3e',
      '5291da39-8061-4667-8a07-3afb3bb89c81',
      '3c3fc853-14b4-41ff-88ae-65a8a9915782',
      '60c92051-a0d4-40b4-80c6-97e5304951c9',
      'c862578b-8294-469c-8cbc-cc31661f461e',
      'c657ef59-625d-4e8a-b3b7-486aa4d881b2',
      '3b6f0cdc-182c-4a3a-85bd-596563cb67ed',
      '68bb82f6-d881-4aa1-979a-e57bc08000ba',
      '1b459624-d6c2-4881-961d-5f4eb76b3e14',
      'f6e7cfe6-08bb-4a79-9b5f-265100648828',
      '5f4dccce-cdc0-4dc1-a58a-df1d34308cc6',
      'abe53cbf-c581-4fa4-92bc-e212461cdb95',
      '624e7821-df19-40b5-a591-b907218f8822',
      '24492d07-9315-489c-a033-a72ba7704fe3',
      '0723fae8-62ff-444e-bf78-a986c5bd772a',
      'a746c219-9a74-4ea3-b66b-ab4176141ad9',
      'aff0cdfb-9c82-4123-9a6e-81958732dbf2',
      'be5e4ed4-3738-4cb1-a296-c354d18b7f0d',
      'a97378a1-cf09-426d-9a70-b2e132279215',
      'c7f1e6d2-63e6-48b0-85be-9d61248e84c3',
      '0989df33-4d6d-42eb-859b-a61a96a35d3a',
      '2d73e962-c16f-43b5-b2be-c4aef2d83162',
      '34659051-5785-4508-93ce-1930081bd2bc',
      '17511836-4d78-443c-aa51-e5ff2a15f556',
      '126b847b-67c4-4f6b-bbbd-0cae72d3d87c',
      '402e0da0-c2df-4110-8a51-d91517b0060e',
      '3504beaa-d424-418d-bdae-c51943591536',
      'c72e2644-f5ad-40d3-b297-b12e2a1b4468',
      'a8c5aa94-f645-44b8-be28-a5538b6cdaae',
      'f1f9d3c2-7d85-4daa-b34e-d072a3a32b09',
      'a3fb954d-1d04-4519-b780-8f68e63b1282',
      '3e81991d-dbce-4693-a8c9-4e5ac83d742d',
      'f190a204-1b03-4525-b619-41ba09d4069a',
      '6b334da6-40aa-47dc-b6a4-2801d66ca0b6',
      '20229bac-28bd-4137-8860-fcff3753ea53',
    ];

    list.push(
      'f4cc28e6-b03a-4f46-be3c-ecff8d75977e',
      'fcc53f89-4e34-4367-a7fc-259a85e79b3f',
      'f97542f9-cb9f-4d80-9363-8dd33047e1cb',
      '93256f26-8216-4dc1-af35-fa102f254d46',
      '67220cc8-635c-4354-b950-41e1b032eeed',
      '63036df5-4660-402a-b427-55451a0e5862',
      '49bcbd57-5d1f-433d-9973-dbe76123736a',
      '12a1f31c-0e32-444b-990d-65ba81f0b9b0',
      'a37d4b63-4912-450f-8476-206e9769afaa',
      'ceba6968-71b6-4f70-97f6-e9332ca63255',
      'e27dfdb7-baa4-48c2-a640-4126348a68fe',
      '081c906c-4468-4387-94e9-7001ba046cdb',
      '4ce9b5af-215f-4332-8c0d-fb5b00f74ee9',
      '5d417e37-3b30-49bc-a0ef-147ba2f9ef16',
      '52070d43-25c8-4e4b-bbbd-96f6bbfb9960',
      '4d4ce5f1-20bf-4a0d-83dd-a63d6603c683',
      'f79caa2c-3962-4364-ab5f-f6de79f76b06',
      '5128815c-ef0a-48fb-8dc0-d2812bda596c',
      'fb7511d4-1711-469e-aca9-2edc5496df68',
      'ed3c8020-16f8-40fe-8f14-49b61f4d99d8',
      '393634e1-04ec-4df9-8446-381a9862c2af',
      '8d81db68-dc97-440f-8615-6384628ed1ba',
      '0e4e1e33-1935-4f31-a363-c9d0dd1cdc8f',
      '4d069ad2-6ae2-4208-93d9-d213d96ccc77',
      'a63da239-1cfa-459e-8c26-a9810de80719',
      '87d93976-b078-48dc-9c8a-5aa435bbace3',
      'dd5230ac-ae6d-45a5-be51-16d638feea6f',
      '4e98df47-73ea-4805-8e53-f3e5bf888dbf',
      '11be473d-72bc-4ae7-9a2d-c7773d08168e',
      'c67137a6-393f-432a-8254-28cdc3cd4c06'
    );

    list.push(
      'ca6fe792-9ae3-46ab-a27c-28689bfe5d8d',
      'd5fffdc0-21bf-4d47-a33d-3f76be59f6ee',
      'e2c6a6ac-dead-473f-b198-4ceadf0ec1a5',
      'bf28c05b-5d42-4b3c-801b-cd877ca0e685',
      'e2a85d63-6909-41de-8979-ae595500adac',
      '3d6ce9da-2497-4513-8633-bd2a5ff16a96',
      'be7957d7-3d41-403c-a0e9-877b0ed31dc0',
      'c7cf7786-f18b-4b37-b3fa-1aababdc2aca',
      '3e195fb1-7bf7-4f27-a251-d627d95d22ed',
      '86f91d2c-9909-4baf-9135-5c2b9130ddcd',
      '92c0a722-c328-4406-9308-9d2ec0350dc8',
      '14f2a7b6-be33-494c-9be6-1bf4bc27ae66',
      'b36a8084-6e0c-4654-9df2-34df2ac9f81e',
      '856aee35-3699-425b-b956-3f3289ab48ac',
      'c596ac00-a3de-4e87-90b4-0fef9934c024',
      'afda94bb-8862-436e-8505-7a576aa6f90c',
      'a36243da-ca26-44a4-844d-aefcc735ecbc',
      'f233fc42-9978-45c0-9766-41ee2582693c',
      'a0e35bb3-6581-4e6e-b393-e824f9f7f8b7',
      '8d01394e-d77f-4a4e-8156-7b20da553083',
      'f7d16388-fbfd-48f2-a386-766bd7739c75',
      'aa92fde1-7783-4c01-ac01-a3761b5106f9',
      'd7e03a82-ca06-4877-9e46-7dfa4829bc29',
      '7978ebe6-319a-4e66-9e86-00cf627c7698',
      '54b4c6b4-c005-4ef2-ba92-517bfdb088f6',
      '5c11622c-e520-43d1-906f-3e75e45083d6',
      '1e8177ef-a639-414c-a138-ccf26d6c1a89',
      'a111d141-a7bb-4825-83a1-ddc6fc3aa49d',
      '3a9fac66-f7c6-420c-b6bf-789190977155'
    );

    list.push(
      'aa18385d-5f22-42cf-83ee-37b0bc686921',
      'a5d8f609-7944-46c8-83f7-8c20c3c1b009',
      '91fbd262-8d65-402e-90c6-aa2444a61228',
      'bd24e989-c6eb-49ec-a953-34b0ffcc4823',
      '4cfcd755-38d6-42c3-99d5-083b39c0dce5',
      '9eb0b97f-9c0f-4ba4-8d4b-b11db8afb365',
      '8706e704-878b-458b-a06e-759f533f41be',
      '4c5930da-2234-4413-bca2-b8d7a48cd996',
      '8fa1a395-0c8d-4a81-865b-8ef7bae2362b',
      '67bd948e-8aa6-401e-a028-d9809d319f50',
      '0f44a673-3ebc-41ca-b5d7-bf62d2b86ec1',
      '8d06767b-19b7-4e63-9b33-69f6660cf2a6',
      '95cffdd8-5513-4ad3-b96a-fa57009a1f84',
      '43405482-1b6a-4276-9e07-681b894cef29',
      '60a68044-7a0d-4a34-b34a-dc09879f72f9',
      'c752f61b-6a2e-4af5-96d6-25c5a106c760',
      '14616dbc-f536-4d43-84a0-02dd0e0dc119',
      '1b7ddcca-31a9-4eb4-86b5-2b9d0f74702e',
      'f9c3e4f3-d2bd-408e-8156-533d86956c70',
      '6448daf0-b0ad-42f1-8c13-efc75eb44c19',
      'b78fe7e1-b804-4daa-9c66-9f6506b012cc',
      '4a94b242-9593-46f8-8eea-39dd6c9dbb93',
      '8ebe66f4-ab66-42b2-a620-ca15502af08f',
      '5348625f-6583-4125-9ae7-f6978f7d307a',
      'f78115c8-f0e5-4f2d-ac8c-27f31c6fd450',
      '4451ac35-6098-4be2-94ad-551dbdc31521',
      '611aa2f7-bf26-4dd0-8c19-7dc136fe770a',
      '731d9ade-ab52-486c-bf1e-66f2be2426c1',
      '2f187cef-81dc-40a6-a59a-421b7ad3f300'
    );

    //list = ['5b098cf9-48a4-4605-9536-aad7442624f0'];
    return list;
  }
}
