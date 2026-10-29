# Hardware Lab Asset Registry

Reviewed: 2026-10-26

This registry distinguishes locally acquired media from externally hosted 3D
model candidates. A listing as a candidate does not mean that it was downloaded
or integrated. The existing selectable hardware models remain original,
procedurally generated Three.js teaching geometry.

## Locally acquired assets

| Asset ID | Component / purpose | Source | Creator | License / attribution | Format and size | Validation and hierarchy | Interactions | Import date |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `commons-computer-interior-018` | Desktop system interior reference photograph; not a 3D model | [Wikimedia Commons file page](https://commons.wikimedia.org/wiki/File:Computer_from_inside_018.jpg) | Kallerna | Public domain; attribution is not required. SCHOOL displays a courtesy credit and links to the source page. | JPEG, 1415 x 1337, 278,947 bytes | Source metadata identifies the pictured Antec P180b system and lists its parts. The local file is a static photograph; it has no mesh or component hierarchy. | Image-plane viewing only; does not support part selection, X-ray, or disassembly. | 2026-10-26 |

This image is represented in the shared asset registry as
`cs-hardware-interior-photo` after running the scientific-assets migration. It
is a static reference, not the lab's procedural exploded assembly.

The acquired image is served locally from `public/images/hardware-interior-reference.jpg`;
the classroom does not hotlink the Commons preview.

## Interactive 3D model reference

| Candidate ID | Model and source | Creator | License and use | Download / format | Geometry and hierarchy | Status |
| --- | --- | --- | --- | --- | --- | --- |
| `sketchfab-3bc94057328243d4b341a55f59160f8a` | [MotherBoard + Components](https://sketchfab.com/3d-models/motherboard-components-3bc94057328243d4b341a55f59160f8a) | Daniel Cardona (`DanielCardonaArt`) | Sketchfab Data API and model page report **CC BY 4.0**. Commercial use is allowed with attribution and a license notice. The SCHOOL UI attributes the creator, links to the model and license, and does not modify the model. | The Data API reports a downloadable GLB archive of 15,884,960 bytes (about 15.2 MiB), 86,688 archive vertices, and 18 textures. Sketchfab's download documentation requires an authorized account request; this model's download endpoint returned HTTP 401 without authentication. The archive itself was not acquired or independently inspected. | Model metadata reports 44,060 vertices and 82,090 faces. The creator describes a motherboard, CPU, RAM, and M.2 SSD. Mesh separation, textures, technical accuracy, and component hierarchy could not be inspected without the archive. | The live Sketchfab viewer is integrated as an optional, user-triggered external reference in the Hardware Lab. It is not downloaded or bundled and is not connected to SCHOOL's component inspector, X-ray, or exploded-view controls. The integrated browser displayed Sketchfab's device-capability warning instead of rendering the model, so rendering on target student devices remains unverified. Archive review and local integration remain blocked on authorized download access. |

## Sources checked and not imported

- [Sketchfab download requirements](https://sketchfab.com/developers/download-api/downloading-models): the official documentation requires user authentication and an authorized request before a model archive can be retrieved. No credentials were available or requested; the authentication boundary was not bypassed.
- [Wikimedia Commons: Computer hardware](https://commons.wikimedia.org/wiki/Category:Computer_hardware): the category includes photography, not a suitable downloadable interactive computer assembly model.
- [Wikimedia Commons: Motherboards](https://commons.wikimedia.org/wiki/Category:Motherboards): Commons identifies this category as empty and asks for recategorization.
- [CGTrader computer models](https://www.cgtrader.com/3d-models/computer) and [PC models](https://www.cgtrader.com/3d-models/pc): these are marketplace listing pages. No particular model was selected, so no product-specific license, commercial-use grant, download permission, format, or hierarchy was verified. No marketplace asset was downloaded.
- Sketchfab search results included an “Aero PC case” with a CC Attribution-NonCommercial license. It was not selected because the noncommercial restriction does not establish permission for commercial educational use.

## Verification limits

- No third-party 3D model has been downloaded or bundled. The local static photo is the only newly acquired external asset.
- The Sketchfab model is integrated only as an optional, externally hosted viewer; it is not part of SCHOOL's local 3D scene.
- Existing hardware geometry and interactions are still procedural and illustrative; this registry does not assert manufacturer accuracy.
- A candidate model must be downloaded through an authorized account, then inspected for format, byte size, embedded textures, mesh/component names, separability, scale, and technical accuracy before it can be registered as an imported model.
- Until that validation occurs, the candidate provides no component-level selection, assembly, X-ray, or exploded-view functionality in this application.
