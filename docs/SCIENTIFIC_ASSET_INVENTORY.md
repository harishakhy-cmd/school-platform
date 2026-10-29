# Virtual laboratory asset inventory

Reviewed: 2026-10-27

This inventory distinguishes locally imported files, live source connections,
external references, and candidates. A source link or a rendered object is not
proof that a model is an exploded assembly, an X-ray, or scientifically
validated. The `scientific_assets` registry migration adds these records;
apply it with `npm run migrate:scientific-assets` before expecting them in the
library or the in-lab **Sourced assets** panels.

## Registered assets and source integrations

| Laboratory | Item name | Source URL | Asset type | License / attribution | Import status | Supported interactions | Scientific validation status |
|---|---|---|---|---|---|---|---|
| Computer Science and ICT | Desktop computer interior reference photograph | [Wikimedia Commons file](https://commons.wikimedia.org/wiki/File:Computer_from_inside_018.jpg) | Local JPEG photograph | Public domain, worldwide release by Kallerna. Courtesy credit: “Kallerna, Computer from inside 018.jpg, Wikimedia Commons.” | **Imported locally** to `public/images/hardware-interior-reference.jpg` | Image-plane rotate, zoom, pan. No part selection, separation, or internal visibility. | Depicts an actual Antec P180b desktop per source caption. Visual identification only; not a component-accuracy review. |
| Computer Science and ICT | MotherBoard + Components | [Sketchfab model page](https://sketchfab.com/3d-models/motherboard-components-3bc94057328243d4b341a55f59160f8a) | 3D model candidate (GLB download not acquired) | CC BY 4.0; attribute Daniel Cardona and link the license. | **Candidate only**. Model page loads; authorized download endpoint returned HTTP 401. The archive was not inspected or imported. | External Sketchfab viewer only. No SCHOOL component selection, assembly or cutaway integration. | Creator describes a motherboard, CPU, RAM and M.2 SSD. Mesh separation, hardware fit, labels and hierarchy are unverified. |
| Biology | Crambin protein, PDB 1CRN | [RCSB entry 1CRN](https://www.rcsb.org/structure/1CRN) · [coordinate file](https://files.rcsb.org/download/1CRN.pdb) | Experimental protein atom-coordinate structure (PDB) | PDB archive data CC0 1.0; cite Hendrickson and Teeter and RCSB PDB. [Usage policy](https://www.rcsb.org/pages/usage-policy). | **Source connected** through the authenticated RCSB proxy; not stored as a local copy. | 3D rotation, zoom, pan, atom/residue selection and labels. No exploded assembly or anatomy cutaway. | Entry identifies X-ray diffraction coordinates for crambin. Source provenance checked; this is a protein structure, not a human anatomical model or clinical validation. |
| Chemistry | Water, PubChem CID 962 | [PubChem compound 962](https://pubchem.ncbi.nlm.nih.gov/compound/962) · [3D SDF source](https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/962/SDF?record_type=3d) | Source-generated molecular conformer (SDF) | PubChem aggregates contributor data; record-specific terms apply. Attribute PubChem CID 962 and consult contributor terms before redistribution. | **Source connected** through the authenticated PubChem proxy; no local source file imported. | 3D rotation, zoom, pan, atom selection and labels. The model's atom spheres are display aids; no components can be exploded. | CID/SDF endpoint and atom/bond records checked. This is a computed conformer, not an experimentally observed structure; no independent chemistry review claimed. |
| Physics | Roman Space Telescope Wide Field Instrument exploded-view diagram | [Wikimedia Commons file page](https://commons.wikimedia.org/wiki/File:Wide_Field_Instrument_Exploded_View.png) · [original PNG](https://upload.wikimedia.org/wikipedia/commons/c/c1/Wide_Field_Instrument_Exploded_View.png) | Static 1551×1158 PNG exploded-view illustration/photo composite (1,465,376 bytes) | CC BY 4.0. Attribute Benjamin Cromey, link the license, and indicate any changes; no changes made. | **Imported locally** to `public/images/physics-roman-wide-field-instrument-exploded.png`; source file download returned HTTP 200 and image/png. | Static image-plane rotate, zoom, pan only. It does not support component selection/removal, true 3D rotation or assembly. | Source caption labels EWA, COBA, ACM, FPA and other assemblies. Provenance and labels checked against the file page; not an independent hardware inspection. |
| Physics | Fundamental physical constants | [NIST CODATA reference](https://physics.nist.gov/cuu/Constants/index.html) | External reference data | NIST reference table; follow source-specific reuse notices and cite NIST. | **External reference**; not downloaded into the application. | Search and browse the official NIST reference page. No 3D model interactions. | Official source and CODATA reference page checked. Reference values are not lab measurements or a physical apparatus. |
| Geography | ASTER GDEM v3 elevation samples | [Open Topo Data ASTER notes](https://www.opentopodata.org/datasets/aster/) · [API documentation](https://www.opentopodata.org/api/) | Source elevation grid rendered as terrain | Underlying ASTER is a METI/NASA dataset. The application does not assert downstream redistribution rights; use the live service and check source terms. | **Source connected**; each request samples a 10×10 grid. No DEM file imported. | Geography Lab builds a rotatable/zoomable surface from returned samples; user can adjust vertical exaggeration. No component picking or cutaway. | Source dataset and API documented. The rendered 100-point grid is not a full-resolution 30 m mesh; no geology beneath the terrain is inferred. |
| Mathematics | NOAA Mauna Loa monthly atmospheric CO₂ | [NOAA trends and notes](https://gml.noaa.gov/ccgg/trends/data.html) · [CSV observations](https://gml.noaa.gov/webdata/ccgg/trends/co2/co2_mm_mlo.csv) | Observed time-series CSV | NOAA makes the data freely available to public and scientific users and requests credit; pre-May 1974 observations are from Scripps Institution of Oceanography. | **External live source**; charted through the NOAA proxy and not stored as a local file. | Load into graph, plot, zoom and read values in the table. No 3D or exploded view. | CSV availability and source notes checked. It is a Mauna Loa local-site series, with the noted temporary Maunakea site, not a global average. |

`source_verified` in the registry records reviewed provenance and source notes;
it does not certify every internal feature, grant broad redistribution rights,
or replace independent scientific validation. The candidate Sketchfab record
is private and cannot be loaded by students or the classroom whiteboard.

## Candidate assets requiring approval or preparation

| Laboratory | Candidate subject | Source URL | Asset type | License / attribution | Download status | Interactions and validation work still needed |
|---|---|---|---|---|---|---|
| Computer Science and ICT | Motherboard and component assembly | [Sketchfab model](https://sketchfab.com/3d-models/motherboard-components-3bc94057328243d4b341a55f59160f8a) | GLB 3D model | CC BY 4.0; Daniel Cardona attribution required | Download was unauthorized (HTTP 401); do not mirror or claim local import. | Request authorized download; inspect hierarchy, parts, scale, textures, labels and assembly relation before connecting to exploded controls. |
| Biology | Dragonfly compound eye or other anatomical teaching model | [NIH 3D](https://3d.nih.gov/) and [RCSB PDB](https://www.rcsb.org/) | Candidate 3D anatomical/structural model | No item selected; item-specific license and attribution unknown. | Portal availability verified; no particular record or downloadable model verified. | Select an item with source record, license, downloadable geometry and suitable separable parts; validate labels and anatomy. Do not invent internal eye structures. |
| Chemistry | Molecular conformer or crystal structure for a selected lesson compound | [PubChem](https://pubchem.ncbi.nlm.nih.gov/) | Candidate SDF / source conformer | Contributor-specific terms must be checked for each record. | Individual records must be checked; the integrated water record is source-connected, not locally imported. | Distinguish computed conformers from experimental crystallographic geometry; validate bond records, stereochemistry and source terms. |
| Physics | A specific mechanics assembly to complement the optical instrument diagram | [Sketchfab downloadable models](https://sketchfab.com/search?type=models&q=physics%20apparatus&features=downloadable) · [NIH 3D](https://3d.nih.gov/) | Candidate 3D apparatus | No item selected; license unknown. | Search pages are available; no item-level download or license verified. | Select a permitted source model; inspect measurement scale, part hierarchy and apparatus accuracy before integration. |
| Geography | A geological cross-section or physical landform model with source-backed geometry | [Wikimedia Commons exploded views](https://commons.wikimedia.org/wiki/Category:Exploded_views) · [Open Topo Data](https://www.opentopodata.org/datasets/) | Candidate diagram / elevation surface | Commons file licenses and ASTER terms are item/dataset specific. | Category and dataset documentation available; no new exploded diagram imported. | Verify each file's author/license and geographic/scientific provenance. A surface DEM does not reveal subsurface geology. |
| Mathematics | No physical exploded-view subject is appropriate to the existing graphing lab | [NOAA CO₂ data](https://gml.noaa.gov/ccgg/trends/data.html) | Candidate measured datasets for graph exercises | NOAA's dataset is freely available with requested attribution; other datasets need separate review. | NOAA series is source-connected; other datasets not selected. | Choose datasets that match a defined mathematical objective and document sampling, units, uncertainty and provenance. |

The Wikimedia Commons exploded-view category is a discovery source, not a
blanket license. Every file requires a file-page license/author check and an
original download check. Likewise, the NIH 3D, RCSB and PubChem portals do not
give every record the same reuse terms.

## Integration and classroom use

- Each lab page now has a **Sourced assets** panel. It requests only assets
  permitted for that signed-in viewer, displays source/license/import metadata,
  opens model/image records in the shared viewer, and opens data references at
  their source. The Mathematics and Geography entries can call the existing
  graph-load and real-elevation actions.
- Tutors can insert permitted model and image references into the existing
  classroom whiteboard. Data-only references are deliberately excluded from
  that geometry viewer; tutors can share their source or use them in the
  relevant lab instead. Existing whiteboard persistence and CBT APIs are not
  changed.
- Practical assessment actions remain in each lab's existing assessment or
  practical mode. This integration provides traceable model/source access for
  those lessons; it does not convert an illustration into a physical
  measurement or certify an assessment.
- X-ray and cutaway are not applied to images, data, or atom-coordinate models.
  Mesh transparency/cutaway acts only on supplied surfaces and never generates
  hidden structures. The existing CS procedural desktop stays explicitly
  illustrative until a suitable separable, licensed model is acquired.

## Download and migration status

The locally imported third-party files are the public-domain computer interior
photograph at `public/images/hardware-interior-reference.jpg` and the CC BY 4.0
Roman WFI exploded-view image at
`public/images/physics-roman-wide-field-instrument-exploded.png`. PDB,
PubChem, ASTER and NOAA content are fetched from their sources at use time;
NIST is an external reference. No NIH 3D model or Sketchfab model archive has
been imported. Applying the idempotent registry migration seeds metadata only
and does not download third-party files.
